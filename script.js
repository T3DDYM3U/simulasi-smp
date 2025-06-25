// Global variables
let rawData = [];
let filteredData = [];
let charts = {};

// School names mapping
const schoolNames = [
    'SMP 1', 'SMP 2', 'SMP 3', 'SMP 4', 'SMP 5', 'SMP 6', 'SMP 7', 'SMP 8',
    'SMP 9', 'SMP 10', 'SMP 11', 'SMP 12', 'SMP 13', 'SMP 14', 'SMP 15'
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDefaultData();
    initializeSchoolSelector();
});

// Load default CSV data from the uploaded file
async function loadDefaultData() {
    try {
        const response = await fetch('DataPrestasiAkademikBaru.csv');
        if (!response.ok) {
            throw new Error('CSV file not found');
        }
        const csvText = await response.text();
        processCSVData(csvText);
        //showMessage('Data CSV berhasil dimuat otomatis.', 'success');
    } catch (error) {
        console.error('Gagal memuat CSV:', error);
        showMessage('Gagal memuat CSV bawaan. Silakan upload manual.', 'error');
    }
}

// Process CSV data
function processCSVData(csvText) {
    Papa.parse(csvText, {
        header: true,
        delimiter: ';',
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
            rawData = results.data.map(row => {
                // Clean and process the data
                const processedRow = {
                    rangeStart: parseFloat(row['N.Awal']) || 0,
                    rangeEnd: parseFloat(row['N.Akhir']) || 0,
                    totalStudents: parseInt(row['Jumlah']) || 0,
                    smp1: parseInt(row['SMP1']) || 0,
                    smp2: parseInt(row['SMP2']) || 0,
                    smp3: parseInt(row['SMP3']) || 0,
                    smp4: parseInt(row['SMP4']) || 0,
                    smp5: parseInt(row['SMP5']) || 0,
                    smp6: parseInt(row['SMP6']) || 0,
                    smp7: parseInt(row['SMP7']) || 0,
                    smp8: parseInt(row['SMP8']) || 0,
                    smp9: parseInt(row['SMP9']) || 0,
                    smp10: parseInt(row['SMP10']) || 0,
                    smp11: parseInt(row['SMP11']) || 0,
                    smp12: parseInt(row['SMP12']) || 0,
                    smp13: parseInt(row['SMP13']) || 0,
                    smp14: parseInt(row['SMP14']) || 0,
                    smp15: parseInt(row['SMP15']) || 0,
                    remaining: parseInt(row['Total Akhir Jumlah']) || 0
                };
                return processedRow;
            }).filter(row => row.totalStudents > 0); // Filter out empty rows
            
            filteredData = [...rawData];
            updateDashboard();
        }
    });
}

// Update entire dashboard
function updateDashboard() {
    updateStatistics();
    updateCharts();
    updateDataTable();
    renderSchoolRanking();
}

// Update statistics cards
function updateStatistics() {
    const totalStudents = rawData.reduce((sum, row) => sum + row.totalStudents, 0);

    const totalApplicants = schoolNames.reduce((sum, _, index) => {
        const key = `smp${index + 1}`;
        return sum + filteredData.reduce((s, row) => s + row[key], 0);
    }, 0);

    let totalScoreSum = 0;

    filteredData.forEach(row => {
        const midScore = (row.rangeStart + row.rangeEnd) / 2;
        let applicantsInRow = 0;

        for (let i = 1; i <= 15; i++) {
            applicantsInRow += row[`smp${i}`] || 0;
        }

        totalScoreSum += midScore * applicantsInRow;
    });

    const avgScore = totalApplicants > 0 ? (totalScoreSum / totalApplicants).toFixed(1) : 0;

    const highestScore = filteredData.length > 0 ? Math.max(...filteredData.map(row => row.rangeEnd)) : 0;

    document.getElementById('totalStudents').textContent = totalStudents.toLocaleString();
    document.getElementById('totalApplicants').textContent = totalApplicants.toLocaleString();
    document.getElementById('avgScore').textContent = avgScore;
    document.getElementById('highestScore').textContent = highestScore;
}


// Update all charts
function updateCharts() {
    updateSchoolChoiceChart();
    updateScoreDistributionChart();
    updateCompetitionChart();
}

// Update school choice pie chart
function updateSchoolChoiceChart() {
    const ctx = document.getElementById('schoolChoiceChart').getContext('2d');
    
    // Calculate total students per school
    const schoolTotals = schoolNames.map((school, index) => {
        const smpKey = `smp${index + 1}`;
        return filteredData.reduce((sum, row) => sum + row[smpKey], 0);
    });
    
    // Filter out schools with 0 students
    const nonZeroSchools = schoolNames.filter((school, index) => schoolTotals[index] > 0);
    const nonZeroTotals = schoolTotals.filter(total => total > 0);
    
    if (charts.schoolChoice) {
        charts.schoolChoice.destroy();
    }
    
    charts.schoolChoice = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: nonZeroSchools,
            datasets: [{
                data: nonZeroTotals,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return `${context.label}: ${context.parsed} siswa (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update score distribution chart
function updateScoreDistributionChart() {
    const ctx = document.getElementById('scoreDistributionChart').getContext('2d');
    
    // Group data by score ranges for better visualization
    const ranges = filteredData.map(row => `${row.rangeStart.toFixed(1)}-${row.rangeEnd}`);
    const students = filteredData.map(row => row.totalStudents);
    
    if (charts.scoreDistribution) {
        charts.scoreDistribution.destroy();
    }
    
    charts.scoreDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges,
            datasets: [{
                label: 'Jumlah Siswa',
                data: students,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false // Hide x-axis labels due to too many ranges
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah Siswa'
                    }
                }
            },
            elements: {
                bar: {
                    borderSkipped: false,
                }
            }
        }
    });
}

// Update competition analysis chart
function updateCompetitionChart() {
    const ctx = document.getElementById('competitionChart').getContext('2d');
    
    // Calculate competition level for each school
    const schoolCompetition = schoolNames.map((school, index) => {
        const smpKey = `smp${index + 1}`;
        const totalApplicants = filteredData.reduce((sum, row) => sum + row[smpKey], 0);
        
        // Calculate average score of applicants for this school
        let totalScoreSum = 0;
        let studentCount = 0;
        
        filteredData.forEach(row => {
            if (row[smpKey] > 0) {
                const avgScoreForRange = (row.rangeStart + row.rangeEnd) / 2;
                totalScoreSum += avgScoreForRange * row[smpKey];
                studentCount += row[smpKey];
            }
        });
        
        const avgScore = studentCount > 0 ? totalScoreSum / studentCount : 0;
        
        return {
            school: school,
            applicants: totalApplicants,
            avgScore: avgScore
        };
    }).filter(item => item.applicants > 0);
    
    if (charts.competition) {
        charts.competition.destroy();
    }
    
    charts.competition = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Tingkat Persaingan',
                data: schoolCompetition.map(item => ({
                    x: item.avgScore,
                    y: item.applicants,
                    school: item.school
                })),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                pointRadius: 8,
                pointHoverRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `${point.school}: ${point.y} siswa, Rata-rata nilai: ${point.x.toFixed(1)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Rata-rata Nilai Pendaftar'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Jumlah Pendaftar'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Update data table
function updateDataTable() {
    const tableBody = document.getElementById('tableBody');
    const displayedRows = document.getElementById('displayedRows');
    
    let html = '';
    
    filteredData.forEach(row => {
        const rangeText = `${row.rangeStart.toFixed(1)} - ${row.rangeEnd}`;
        html += `
            <tr>
                <td style="text-align: left; font-weight: 600;">${rangeText}</td>
                <td style="font-weight: 600; color: #3498db;">${row.totalStudents}</td>
        `;
        
        // Tambahkan 15 kolom SMP dengan transparansi jika 0
        for (let i = 1; i <= 15; i++) {
            const key = `smp${i}`;
            const value = row[key];
            const isZero = value === 0;
            html += `<td class="${isZero ? 'zero-value' : ''}">${value}</td>`;
        }

        // Kolom terakhir: Sisa
        html += `<td style="color: #e74c3c;">${row.remaining}</td></tr>`;
    });
    
    tableBody.innerHTML = html;
    displayedRows.textContent = filteredData.length;
}

// Initialize school selector
function initializeSchoolSelector() {
    const selector = document.getElementById('schoolSelector');
    
    schoolNames.forEach((school, index) => {
        const chip = document.createElement('div');
        chip.className = 'school-chip';
        chip.textContent = school;
        chip.dataset.school = index + 1;
        chip.addEventListener('click', () => toggleSchoolFilter(chip, index + 1));
        selector.appendChild(chip);
    });
}

// Toggle school filter
function toggleSchoolFilter(chip, schoolIndex) {
    chip.classList.toggle('active');

    const activeSchools = Array.from(document.querySelectorAll('.school-chip.active'))
        .map(chip => parseInt(chip.dataset.school));

    if (activeSchools.length === 0) {
        filteredData = [...rawData];
    } else {
        // Filter dan hanya pertahankan nilai di SMP terpilih, set sisanya jadi 0
        filteredData = rawData
            .filter(row => activeSchools.some(schoolNum => row[`smp${schoolNum}`] > 0))
            .map(row => {
                const newRow = { ...row };
                for (let i = 1; i <= 15; i++) {
                    if (!activeSchools.includes(i)) {
                        newRow[`smp${i}`] = 0; // kosongkan yang tidak terpilih
                    }
                }
                return newRow;
            });
    }

    updateDashboard();
}


// Show messages to user
function showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message, .info-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 
                          type === 'error' ? 'error-message' : 'info-message';
    messageDiv.textContent = message;
    
    // Insert after the header
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', messageDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

function renderSchoolRanking() {
    const rankingContainer = document.getElementById('schoolRanking');
    if (!rankingContainer) return;

    // Hitung rata-rata nilai tiap SMP
    const rankings = schoolNames.map((school, index) => {
        const key = `smp${index + 1}`;
        let totalScore = 0;
        let totalStudents = 0;

        filteredData.forEach(row => {
            const count = row[key] || 0;
            const avgRange = (row.rangeStart + row.rangeEnd) / 2;
            totalScore += avgRange * count;
            totalStudents += count;
        });

        const avg = totalStudents > 0 ? (totalScore / totalStudents) : 0;

        return {
            name: school,
            avgScore: avg,
            count: totalStudents
        };
    }).filter(item => item.count > 0) // hanya sekolah yang punya pendaftar
      .sort((a, b) => b.avgScore - a.avgScore); // urutkan dari tertinggi

    // Tampilkan ranking sebagai HTML
    let html = `<table class="ranking-table">
        <thead><tr><th>Peringkat</th><th>SMP</th><th>Rata-rata Nilai</th><th>Pendaftar</th></tr></thead>
        <tbody>`;

    rankings.forEach((item, i) => {
        html += `<tr>
            <td style="font-weight:bold;">#${i + 1}</td>
            <td>${item.name}</td>
            <td>${item.avgScore.toFixed(1)}</td>
            <td>${item.count}</td>
        </tr>`;
    });

    html += `</tbody></table>`;
    rankingContainer.innerHTML = html;
}
