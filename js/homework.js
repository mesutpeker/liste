// Varsayılan tarih değerlerini ayarlama
function setDefaultDates() {
    const today = new Date();
    const startDate = today;
    const endDate = new Date();
    endDate.setDate(today.getDate() + 28); // 4 hafta sonra
    
    document.getElementById('startDate').valueAsDate = startDate;
    document.getElementById('endDate').valueAsDate = endDate;
}

// Ödev çizelgesi oluşturma
function generateHomeworkSchedule(startDate, endDate, forPrint = false) {
    console.log('Çizelge oluşturuluyor:', startDate, endDate);
    
    // Öğrenci listesini al
    const students = classesByName[currentScheduleClass];
    if (!students || students.length === 0) {
        alert('Bu sınıfta öğrenci bulunamadı.');
        return;
    }
    
    console.log('Öğrenci sayısı:', students.length);
    
    // Tarih aralığındaki haftaları hesapla
    const weeks = getWeeksInRange(startDate, endDate);
    console.log('Hesaplanan haftalar:', weeks);
    
    if (weeks.length === 0) {
        alert('Seçilen tarih aralığında hafta bulunamadı.');
        return;
    }
    
    // Önizleme için tabloyu oluştur
    const scheduleTable = createScheduleTable(students, weeks);
    
    // Eğer yazdırma için değilse, önizleme alanını güncelle
    if (!forPrint) {
        const previewArea = document.getElementById('schedulePreview');
        previewArea.innerHTML = '';
        
        // Önizleme için uyarı notu
        const previewNote = document.createElement('div');
        previewNote.className = 'alert alert-info mb-2';
        previewNote.innerHTML = `
            <small><i class="bi bi-info-circle"></i> Yazdırıldığında tablo A4 yatay sayfaya otomatik sığdırılacaktır. Buradaki görünüm sadece önizleme amaçlıdır.</small>
        `;
        previewArea.appendChild(previewNote);
        previewArea.appendChild(scheduleTable.cloneNode(true));
    }
    
    // Yazdırma için tabloyu oluştur
    const printSection = createPrintableVersion(currentScheduleClass, scheduleTable.cloneNode(true));
    
    // Var olan yazdırma alanını temizle
    const oldPrintArea = document.getElementById('homeworkSchedulePrint');
    if (oldPrintArea) {
        oldPrintArea.remove();
    }
    
    // Yazdırma alanını document.body'ye ekle
    // Yazdırma için hemen görünür olacak, önizleme için gizli olacak
    printSection.style.display = forPrint ? 'block' : 'none';
    document.body.appendChild(printSection);
    
    // Yazdır butonunu etkinleştir
    document.getElementById('printScheduleBtn').disabled = false;
    console.log('Çizelge oluşturuldu ve hazırlandı, forPrint:', forPrint);
    
    return printSection; // Dönüş değeri ekledik
}

// Tarih aralığındaki haftaları hesaplama
function getWeeksInRange(startDate, endDate) {
    const weeks = [];
    
    // Tarih doğruluğu kontrolü
    if (!(startDate instanceof Date) || !(endDate instanceof Date) || isNaN(startDate) || isNaN(endDate)) {
        console.error('Geçersiz tarih:', { startDate, endDate });
        return weeks;
    }
    
    console.log('Hafta hesaplama başlangıcı:', { startDate, endDate });
    
    const currentDate = new Date(startDate);
    let weekCounter = 0;
    
    // Her hafta için bir tarih aralığı ekle
    while (currentDate <= endDate && weekCounter < 20) { // Güvenlik için maksimum 20 hafta
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6); // 7 günlük hafta
        
        weeks.push({
            start: new Date(weekStart),
            end: new Date(weekEnd > endDate ? endDate : weekEnd)
        });
        
        console.log(`Hafta ${weekCounter + 1} eklendi:`, { 
            start: formatDate(weekStart), 
            end: formatDate(weekEnd > endDate ? endDate : weekEnd) 
        });
        
        // Sonraki haftaya geç
        currentDate.setDate(currentDate.getDate() + 7);
        weekCounter++;
    }
    
    console.log(`Toplam ${weeks.length} hafta bulundu`);
    return weeks;
}

// Çizelge tablosunu oluşturma
function createScheduleTable(students, weeks) {
    const table = document.createElement('table');
    table.className = 'table table-bordered table-sm';
    table.style.tableLayout = 'fixed';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.borderSpacing = '0';
    table.style.emptyCells = 'show';
    table.style.border = '2px solid black';
    
    // Başlık satırı
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Öğrenci adı sütunu
    const thStudent = document.createElement('th');
    thStudent.textContent = 'ÖĞRENCİ ADI';
    thStudent.style.width = '25%';
    thStudent.style.minWidth = '25%';
    thStudent.style.maxWidth = '25%';
    thStudent.style.textAlign = 'left';
    thStudent.style.padding = '2px 5px';
    thStudent.style.verticalAlign = 'bottom';
    thStudent.style.fontWeight = 'bold';
    thStudent.style.border = '2px solid black';
    headerRow.appendChild(thStudent);
    
    // Hafta sütunları için kalan genişliği hesapla
    const weekColumnWidth = (75 / weeks.length).toFixed(2); // 75% kalan genişlik
    
    weeks.forEach((week, index) => {
        const th = document.createElement('th');
        th.style.width = `${weekColumnWidth}%`;
        th.style.minWidth = `${weekColumnWidth}%`;
        th.style.maxWidth = `${weekColumnWidth}%`;
        th.style.padding = '2px 1px';
        th.style.textAlign = 'center';
        th.style.verticalAlign = 'bottom';
        th.style.position = 'relative';
        th.style.fontWeight = 'bold';
        th.style.border = '2px solid black';
        
        const headerDiv = document.createElement('div');
        headerDiv.style.writingMode = 'vertical-rl';
        headerDiv.style.transform = 'rotate(180deg)';
        headerDiv.style.whiteSpace = 'nowrap';
        headerDiv.style.height = '70px';
        headerDiv.style.width = 'auto';
        headerDiv.style.margin = '0 auto';
        headerDiv.style.display = 'flex';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.justifyContent = 'center';
        headerDiv.style.fontSize = '7px';
        headerDiv.style.lineHeight = '1';
        headerDiv.style.fontWeight = 'bold';
        headerDiv.innerHTML = `HAFTA ${index + 1}<br>${formatDate(week.start)}<br>${formatDate(week.end)}`;
        
        th.appendChild(headerDiv);
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Öğrenci satırları
    const tbody = document.createElement('tbody');
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.style.height = '25px';
        
        // Öğrenci adı sütunu
        const tdName = document.createElement('td');
        tdName.textContent = `${student.student_no} - ${student.first_name} ${student.last_name}`;
        tdName.style.width = '25%';
        tdName.style.minWidth = '25%';
        tdName.style.maxWidth = '25%';
        tdName.style.textAlign = 'left';
        tdName.style.paddingLeft = '5px';
        tdName.style.whiteSpace = 'normal';
        tdName.style.overflow = 'visible';
        tdName.style.fontSize = '9px';
        tdName.style.lineHeight = '1.2';
        tdName.style.height = '25px';
        tdName.style.fontWeight = 'bold';
        tdName.style.borderLeft = '2px solid black';
        tdName.style.borderRight = '2px solid black';
        tdName.title = `${student.student_no} - ${student.first_name} ${student.last_name}`;
        
        // Son satır için alt kenarlık
        if (index === students.length - 1) {
            tdName.style.borderBottom = '2px solid black';
        }
        
        row.appendChild(tdName);
        
        // Hafta sütunları
        weeks.forEach((_, weekIndex) => {
            const td = document.createElement('td');
            td.style.width = `${weekColumnWidth}%`;
            td.style.minWidth = `${weekColumnWidth}%`;
            td.style.maxWidth = `${weekColumnWidth}%`;
            td.style.textAlign = 'center';
            td.style.verticalAlign = 'middle';
            td.style.padding = '2px 1px';
            td.style.border = '1px solid #666';
            td.style.height = '25px';
            
            // Son satır için alt kenarlık
            if (index === students.length - 1) {
                td.style.borderBottom = '2px solid black';
            }
            
            td.innerHTML = '&nbsp;';
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    return table;
}

// Yazdırılabilir versiyonu oluşturma
function createPrintableVersion(className, table) {
    // Print wrapper
    const printWrapper = document.createElement('div');
    printWrapper.id = 'homeworkSchedulePrint'; // Print div'i için doğrudan ID atıyoruz
    printWrapper.style.width = '100%';
    printWrapper.style.maxWidth = '100%'; // A4 genişliği (yatay)
    printWrapper.style.minHeight = 'auto'; // A4 yüksekliği (yatay) yerine auto
    printWrapper.style.margin = '0'; // Sayfayı ortala
    printWrapper.style.pageBreakInside = 'avoid';
    printWrapper.style.pageBreakAfter = 'avoid';
    printWrapper.style.overflow = 'visible';
    printWrapper.style.position = 'relative';
    printWrapper.style.backgroundColor = 'white';
    printWrapper.style.display = 'block';
    printWrapper.style.boxSizing = 'border-box';
    
    // Satır ve sütun sayısına göre CSS sınıfları ekle
    // Sütun (hafta) sayısına göre sınıf ekle
    const columnCount = table.querySelectorAll('th').length - 1; // Öğrenci adı sütununu çıkar
    if (columnCount <= 5) {
        printWrapper.classList.add('cols-1-5');
    } else if (columnCount <= 10) {
        printWrapper.classList.add('cols-6-10');
    } else if (columnCount <= 15) {
        printWrapper.classList.add('cols-11-15');
    } else {
        printWrapper.classList.add('cols-16-20');
    }
    
    // Satır (öğrenci) sayısına göre sınıf ekle
    const rowCount = table.querySelectorAll('tbody tr').length;
    if (rowCount <= 15) {
        printWrapper.classList.add('rows-1-15');
    } else if (rowCount <= 30) {
        printWrapper.classList.add('rows-16-30');
    } else {
        printWrapper.classList.add('rows-31-plus');
    }
    
    // İçerik konteyneri
    const container = document.createElement('div');
    container.style.padding = '0.2cm';
    container.style.overflow = 'visible';
    container.style.pageBreakInside = 'avoid';
    container.style.pageBreakAfter = 'avoid';
    container.style.height = 'auto'; // A4 yüksekliğine sabitlenmedi
    container.style.width = '100%'; // Genişliği %100 yap
    container.style.boxSizing = 'border-box';
    
    // Başlık
    const title = document.createElement('h3');
    title.textContent = `${className} - Ödev Çizelgesi`;
    title.style.textAlign = 'center';
    title.style.margin = '0 0 0.1cm 0';
    title.style.padding = '0';
    title.style.fontSize = '12px';
    title.style.fontWeight = 'bold';
    title.style.display = 'block';
    
    container.appendChild(title);
    
    // Tablo genişliği ayarlama
    table.className = 'print-table'; // CSS sınıfı ekle
    table.style.width = '100%';
    table.style.height = 'auto';
    table.style.fontSize = columnCount > 10 ? '7px' : '8px';
    table.style.borderCollapse = 'collapse';
    table.style.tableLayout = 'fixed';
    table.style.margin = '0';
    table.style.pageBreakInside = 'avoid';
    table.style.border = '1px solid #000';
    table.style.boxSizing = 'border-box';
    table.style.transformOrigin = 'top left'; // Transform origin ekle
    
    // TH ve TD stillerini güncelle
    const allCells = table.querySelectorAll('th, td');
    allCells.forEach(cell => {
        cell.style.border = '1px solid #000';
        cell.style.padding = '2px';
        cell.style.boxSizing = 'border-box';
    });
    
    // Tüm satır ve hücrelerin stillerini ayarla
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        row.style.height = 'auto';
        row.style.pageBreakInside = 'avoid';
    });
    
    // İlk sütun (öğrenci adı) genişliğini ayarla
    const firstColumnCells = table.querySelectorAll('tr > *:first-child');
    firstColumnCells.forEach(cell => {
        cell.style.width = '25%'; // 35% yerine 25% yap
        cell.style.maxWidth = '25%'; // 35% yerine 25% yap
        cell.style.textAlign = 'left';
        cell.style.paddingLeft = '5px';
        cell.style.whiteSpace = 'normal'; // Öğrenci ismi için normal text wrap
        cell.style.overflow = 'visible'; // Taşan metin görünsün
        cell.style.textOverflow = 'clip'; // Ellipsis yerine clip kullan
        cell.style.fontWeight = 'normal';
        cell.style.padding = '2px 5px';
        cell.style.fontSize = '9px';
        cell.style.lineHeight = '1.1';
    });
    
    // Diğer sütunların genişliğini hafta sayısına göre dinamik ayarla
    const otherColumnCells = table.querySelectorAll('tr > *:not(:first-child)');
    const weekWidth = 75 / columnCount; // 65 yerine 75 yap
    otherColumnCells.forEach(cell => {
        cell.style.width = `${weekWidth}%`;
        cell.style.maxWidth = `${weekWidth}%`;
        cell.style.minWidth = `${weekWidth}%`;
        cell.style.textAlign = 'center';
        cell.style.padding = '2px 1px';
    });
    
    // Dikey başlıkları hizala
    const headerDivs = table.querySelectorAll('th div[style*="writing-mode"]');
    headerDivs.forEach(div => {
        div.style.height = '70px';
        div.style.margin = '0 auto';
        div.style.width = 'auto';
        div.style.fontSize = '7px';
        div.style.lineHeight = '1';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
    });
    
    // Başlık hücrelerini güncelle
    const headerCells = table.querySelectorAll('th');
    headerCells.forEach(th => {
        th.style.backgroundColor = '#f2f2f2';
        th.style.fontWeight = 'bold';
        th.style.position = 'sticky';
        th.style.top = '0';
        th.style.verticalAlign = 'bottom';
    });
    
    container.appendChild(table);
    printWrapper.appendChild(container);
    
    return printWrapper;
}

// Yazdırma işlemi
document.getElementById('printScheduleBtn').addEventListener('click', function() {
    // Önce tarihleri kontrol et
    const startDate = document.getElementById('startDate').valueAsDate;
    const endDate = document.getElementById('endDate').valueAsDate;
    
    if (!startDate || !endDate) {
        alert('Lütfen geçerli bir tarih aralığı seçin.');
        return;
    }
    
    if (startDate > endDate) {
        alert('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
        return;
    }
    
    // Yazdırma için yeni çizelge oluştur (forPrint=true)
    generateHomeworkSchedule(startDate, endDate, true);
    
    // Sayfa hazırsa yazdır
    setTimeout(() => {
        // Yazdırma tablosunun boyutunu kontrol et ve ayarla
        const printArea = document.getElementById('homeworkSchedulePrint');
        if (printArea) {
            const columnCount = printArea.querySelector('table').querySelectorAll('th').length - 1;
            if (columnCount > 10) {
                // Kolonlar sayfa genişliğine sığmayabilir, fontları daha da küçült
                printArea.querySelectorAll('th, td').forEach(cell => {
                    cell.style.fontSize = cell.tagName === 'TH' ? '6px' : '7px';
                    cell.style.padding = '1px';
                });
                
                // Dikey başlıkları daha kompakt hale getir
                printArea.querySelectorAll('th div[style*="writing-mode"]').forEach(div => {
                    div.style.fontSize = '6px';
                    div.style.height = '50px';
                });
            }
            
            // Yazdırma işlemini başlat
            window.print();
            
            // Yazdırma işlemi tamamlandıktan sonra gizle
            setTimeout(() => {
                printArea.style.display = 'none';
            }, 1000);
        }
    }, 300);
});

// Tarih formatı
function formatDate(date) {
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
} 