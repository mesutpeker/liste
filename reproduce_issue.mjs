import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';

// Mock debugLog
const debugMode = true;
function debugLog(...args) {
    if (debugMode) console.log(...args);
}

// Helper function to merge Turkish characters (mock implementation)
function mergeLetters(text) {
    return text;
}

async function extractClassInfo(pdf) {
    const classes = {};
    const numPages = pdf.numPages;

    try {
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // 1. Tüm metin içeriğini birleştirme
            let fullText = '';
            let prevItem = null;
            let lineTexts = [];
            let currentLine = [];

            // İlk adımda satırları oluştur
            for (const item of textContent.items) {
                if (prevItem && Math.abs(prevItem.transform[5] - item.transform[5]) < 2) {
                    // Aynı satırda, önceki öğeye ekle
                    currentLine.push(item);
                } else {
                    // Yeni satır başlat
                    if (currentLine.length > 0) {
                        lineTexts.push(currentLine);
                    }
                    currentLine = [item];
                }
                prevItem = item;
            }

            // Son satırı ekle
            if (currentLine.length > 0) {
                lineTexts.push(currentLine);
            }

            // Her satırı işle ve metne dönüştür
            let lines = [];
            for (const line of lineTexts) {
                // Satırdaki öğeleri x pozisyonuna göre sırala
                line.sort((a, b) => a.transform[4] - b.transform[4]);

                let lineText = '';
                let prevLineItem = null;

                for (const item of line) {
                    if (prevLineItem) {
                        // Öğeler arasındaki mesafeyi kontrol et
                        const gap = item.transform[4] - (prevLineItem.transform[4] + prevLineItem.width);

                        // Yakın karakterleri birleştir (küçük aralıkları yok say)
                        if (gap < 2) {
                            lineText += item.str;
                        } else if (gap < 20) {
                            // Normal kelime aralığı
                            lineText += ' ' + item.str;
                        } else {
                            // Büyük boşluk, muhtemelen sütun aralığı
                            lineText += '\t' + item.str;
                        }
                    } else {
                        lineText += item.str;
                    }
                    prevLineItem = item;
                }

                lines.push(lineText);
                fullText += lineText + '\n';
            }

            // 2. Sınıf adını bulma
            const classNamePattern = /(\d+\.\s*Sınıf\s*\/\s*[A-Z]\s*Şubesi.*?)(?:\n|$)/i;
            const classMatch = fullText.match(classNamePattern);
            let currentClass = null;

            if (classMatch) {
                currentClass = classMatch[1].trim();
                if (!classes[currentClass]) {
                    classes[currentClass] = [];
                }
            }

            // Only focus on 11D for debugging
            if (currentClass && currentClass.includes("11. Sınıf / D Şubesi")) {
                console.log(`\n--- Page ${pageNum} Analysis for 11D ---`);

                // 3. Öğrenci bilgilerini bulma ve sınıflandırma
                // A) Satır bazlı arama (öncelikli)
                let studentsFound = false;

                for (const line of lines) {
                    // Tab karakterleri ile ayrılmış alanları içeren satırlar muhtemelen öğrenci satırlarıdır
                    if (line.includes('\t')) {
                        const columns = line.split('\t').map(col => col.trim());

                        // Cinsiyet sütununu bul
                        let genderIndex = -1;
                        let mergedSurname = null;

                        for (let i = 0; i < columns.length; i++) {
                            const col = columns[i];
                            // Normal durum: "Erkek" veya "Kız"
                            if (/^(Erkek|Kız|erkek|kız)$/i.test(col)) {
                                genderIndex = i;
                                break;
                            }
                            // Birleşik durum: "ErkekSOYAD" veya "KızSOYAD"
                            const mergedMatch = col.match(/^(Erkek|Kız|erkek|kız)\s*(.+)$/i);
                            if (mergedMatch) {
                                genderIndex = i;
                                mergedSurname = mergedMatch[2]; // "SOYAD" kısmını al
                                break;
                            }
                        }

                        if (genderIndex > 0) {
                            // Cinsiyetten önceki tüm sütunları birleştir
                            const preGenderText = columns.slice(0, genderIndex).join(' ');

                            // Öğrenci numarası ve isim kısmını ayıkla
                            // Genellikle format: "S.No ÖğrenciNo Ad Soyad" veya "S.No ÖğrenciNo Ad"
                            // En sondaki sayı dizisini öğrenci numarası olarak al
                            const numberMatch = preGenderText.match(/(\d+)\s+([^\d]+)$/);

                            if (numberMatch) {
                                const studentNo = numberMatch[1];
                                let namePart = numberMatch[2].trim();

                                let firstName = '';
                                let lastName = '';

                                if (mergedSurname) {
                                    // Soyad cinsiyet sütununda bitişik
                                    firstName = namePart;
                                    lastName = mergedSurname;
                                } else {
                                    // Soyad isim kısmının son kelimesi olabilir
                                    // VEYA soyad cinsiyetten sonraki sütunda olabilir (fakat bu PDF'de genelde isimle bitişik çıkıyor)

                                    // Önce ismin son kelimesini soyad olarak almayı dene
                                    const nameParts = namePart.split(/\s+/);
                                    if (nameParts.length > 1) {
                                        lastName = nameParts.pop();
                                        firstName = nameParts.join(' ');
                                    } else {
                                        firstName = namePart;
                                        // Eğer isim tek kelimeyse ve soyad bulunamadıysa, belki cinsiyetten sonraki sütundadır?
                                        // Ancak debug çıktısında gördüğümüz kadarıyla soyad genelde ismin yanında.
                                    }
                                }

                                if (firstName && lastName) {
                                    // Harfleri düzeltme (mock)
                                    firstName = mergeLetters(firstName);
                                    lastName = mergeLetters(lastName);

                                    classes[currentClass].push({
                                        student_no: studentNo,
                                        first_name: firstName,
                                        last_name: lastName
                                    });

                                    studentsFound = true;
                                    console.log(`MATCHED (Line): ${studentNo} ${firstName} ${lastName}`);
                                }
                            }
                        }
                    }
                }

                // Eğer satır bazlı arama öğrenci bulamadıysa, regex ile dene
                if (!studentsFound) {
                    // debugLog(`Satır bazlı arama öğrenci bulamadı, regex ile deneniyor...`);

                    // B) Regex ile arama (yedek yöntem)
                    // Güncellendi: Cinsiyet ve soyad arasındaki boşluk zorunluluğu kaldırıldı (\s* yapıldı)
                    const studentPattern = /\b(\d+)\s+([A-ZĞÜŞİÖÇÂÎÛa-zğüşıöçâîû\s]+?)\s+(Erkek|Kız|erkek|kız)\s*([A-ZĞÜŞİÖÇÂÎÛa-zğüşıöçâîû\s]+?)\s*(?:\n|$)/g;

                    let match;
                    while ((match = studentPattern.exec(fullText)) !== null) {
                        let firstName = match[2].trim().replace(/\s+/g, ' ');
                        let lastName = match[4].trim().replace(/\s+/g, ' ');

                        classes[currentClass].push({
                            student_no: match[1].trim(),
                            first_name: firstName,
                            last_name: lastName
                        });

                        console.log(`MATCHED (Regex): ${match[1].trim()} ${firstName} ${lastName}`);
                    }
                }
            }
        }

        return classes;
    } catch (err) {
        debugLog(`PDF işleme hatası: ${err.message}`);
        throw err;
    }
}

async function main() {
    const data = new Uint8Array(fs.readFileSync('OOG01001R020_1121.PDF'));
    const loadingTask = pdfjsLib.getDocument(data);
    const pdf = await loadingTask.promise;

    const classes = await extractClassInfo(pdf);

    if (classes["11. Sınıf / D Şubesi"]) {
        console.log(`\nTotal students in 11D: ${classes["11. Sınıf / D Şubesi"].length}`);
    } else {
        console.log("11D not found");
    }
}

main();
