let rawData = [];

const kuotaSMP = {
    smp1: 116, smp2: 91, smp3: 77, smp4: 64, smp5: 128,
    smp6: 91, smp7: 77, smp8: 128, smp9: 102, smp10: 46,
    smp11: 52, smp12: 77, smp13: 25, smp14: 52, smp15: 128, smp16: 91
};

// Load data otomatis
window.addEventListener('DOMContentLoaded', () => {
    fetch('DataPrestasiAkademikBaru.csv')
        .then(res => res.text())
        .then(text => {
            Papa.parse(text, {
                header: true,
                delimiter: ';',
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: function(results) {
                    // ✅ Raw data siap dipakai!
                    rawData = results.data.map(row => ({
                        rangeStart: parseFloat(row['N.Awal']) || 0,
                        rangeEnd: parseFloat(row['N.Akhir']) || 0,
                        totalStudents: parseInt(row['Jumlah']) || 0,
                        remaining: parseInt(row['Total Akhir Jumlah']) || 0,
                        ...Object.fromEntries([...Array(16)].map((_, i) => [`smp${i+1}`, parseInt(row[`SMP${i+1}`]) || 0]))
                    }));

                    // ✅ Sekarang kamu boleh panggil fungsi-fungsi yang butuh rawData:
                    console.log("🏁 rawData loaded");
                    console.table(getSchoolRanking()); // untuk cek ranking benar

                    // Opsional: bisa juga auto-trigger simulasi awal jika mau
                }
            });
        });
});

function simulasikanPeluang() {
    const nilai = parseFloat(document.getElementById('simulasiNilai').value);
    const sekolah = document.getElementById('simulasiSekolah').value;
    const output = document.getElementById('simulasiHasil');
    output.innerHTML = '';

    if (isNaN(nilai) || !sekolah) {
        output.innerHTML = '<span style="color:red;">❌ Harap isi nilai dan pilih sekolah tujuan.</span>';
        return;
    }

 /*   const kuota = kuotaSMP[sekolah] || 0;

    // Hitung berapa siswa yang lebih tinggi dari nilai user dan belum memilih (remaining)
    let totalDiAtas = 0;
    rawData.forEach(row => {
        const avg = (row.rangeStart + row.rangeEnd) / 2;
        if (avg > nilai) {
            totalDiAtas += row.remaining;
        }
    });

    const posisiKamu = totalDiAtas + 1;
    const peluangPersen = 100 - Math.min(100, (posisiKamu / kuota) * 100);

    let status = '';
    if (posisiKamu <= kuota) {
        status = '✅ Tinggi';
    } else if (posisiKamu <= kuota * 1.5) {
        status = '⚠️ Sedang';
    } else {
        status = '❌ Rendah';
    }
*/
const kuota = kuotaSMP[sekolah] || 0;

// Hitung posisi
let totalDiAtas = 0;
rawData.forEach(row => {
    const avg = (row.rangeStart + row.rangeEnd) / 2;
    if (avg > nilai) totalDiAtas += row.remaining;
});

const posisiKamu = totalDiAtas + 1;
const peluangPersen = 100 - Math.min(100, (posisiKamu / kuota) * 100);
let status = posisiKamu <= kuota ? '✅ Tinggi' : posisiKamu <= kuota * 1.5 ? '⚠️ Sedang' : '❌ Rendah';

// Ambil data distribusi 
/*
const hasilDistribusi = simulasiDenganAsumsiDistribusi(nilai, sekolah);
const sekolahFavorit = getSchoolRanking()[0]?.key || 'smp5';
const persenDistribusi = Math.min(
    100,
    ((kuotaSMP[sekolah] - hasilDistribusi.posisiDiTujuan) / kuotaSMP[sekolah]) * 100
);*/





// Simulasi distribusi pesaing ke sekolah favorit
const hasilDistribusi = simulasiDenganAsumsiDistribusi(nilai, sekolah);

// Ambil sekolah favorit tertinggi
const sekolahFavorit = getSchoolRanking()[0]?.key || 'smp5';

output.innerHTML += `
    <div class="simulasi-disclaimer" style="margin-top:30px;">
        <strong>Simulasi Berdasarkan Distribusi Pesaing ke Sekolah Favorit:</strong><br><br>
        Saat ini terdapat <strong>${hasilDistribusi.totalPesaing}</strong> siswa dengan nilai ASPD di atas kamu:

        <div>
        🎯 <strong>Peluang Lolos Berdasarkan Distribusi ke SMP pilihanmu:</strong> 
        <span class="simulasi-status-${hasilDistribusi.peluang.includes('Tinggi') ? 'tinggi' : 'rendah'}">
            ${hasilDistribusi.peluang}
        </span>
        <p><strong>Estimasi Persentase Peluang:</strong> 
        <span class="simulasi-status-${hasilDistribusi.peluang.includes('Tinggi') ? 'tinggi' : 'rendah'}">
            ${(Math.min(100, ((kuotaSMP[sekolah] - hasilDistribusi.posisiDiTujuan) / kuotaSMP[sekolah]) * 100)).toFixed(1)}%
        </span></p></div>
    </div>

        <div class="simulasi-disclaimer">
        ⚠️ <strong>Catatan:</strong> Hasil simulasi ini bersifat estimasi berdasarkan data siswa yang belum mendaftar (jalur prestasi). 
        <br><br>
        Pesaing dengan nilai lebih tinggi belum tentu mendaftar ke SMP yang sama, bisa saja mereka memilih:
        <ul style="margin-top: 10px; margin-left: 20px;">
            <li>Jalur zonasi, afirmasi, atau perpindahan orang tua</li>
            <li>SMP negeri lainnya</li>
            <li>SMP swasta</li>
            <li>Mendaftarkan SMP keluar DIY</li>
        </ul>
        <br>
        Oleh karena itu, <strong>hasil ini bukan penentu </strong>, namun dapat digunakan untuk memetakan peluang secara umum.
    </div>
`;
renderBandingkanSemuaSekolah(nilai);



}

function renderBandingkanSemuaSekolah(nilai) {
    const table = document.createElement('table');
    table.className = 'ranking-table';

    let html = `
        <thead>
            <tr>
                <th>SMP</th>
                <th>Kuota</th>
                <th>Rata-rata Nilai</th>
                <th>Posisi Kamu</th>
                <th>Peluang</th>
                <th>Persentase</th>
            </tr>
        </thead>
        <tbody>
    `;

    const rankedSchools = getSchoolRanking(); // dari yang paling favorit
    const totalPesaing = [];

    // Kumpulkan semua siswa dengan nilai lebih tinggi dari kita
    rawData.forEach(row => {
        const avg = (row.rangeStart + row.rangeEnd) / 2;
        if (avg > nilai) {
            for (let i = 0; i < row.remaining; i++) {
                totalPesaing.push(avg);
            }
        }
    });

    let sisaPesaing = [...totalPesaing];
    const hasilSimulasi = [];

    for (const smp of rankedSchools) {
        const kuota = kuotaSMP[smp.key];
        const dialokasikan = Math.min(kuota, sisaPesaing.length);

        // Kamu akan menempati urutan setelah mereka
        const posisiKamu = dialokasikan + 1;
        const persen = Math.max(0, Math.min(100, ((kuota - posisiKamu + 1) / kuota) * 100));
        const peluang = posisiKamu <= kuota ? '✅ Tinggi' : '❌ Rendah';

        hasilSimulasi.push({
            nama: smp.key.toUpperCase(),
            kuota,
            avg: smp.avg.toFixed(1),
            posisi: posisiKamu,
            peluang,
            persen: persen.toFixed(1)
        });

        // Kurangi sisa pesaing
        sisaPesaing = sisaPesaing.slice(dialokasikan);
    }

    hasilSimulasi.forEach(row => {
        html += `
            <tr>
                <td>${row.nama}</td>
                <td>${row.kuota}</td>
                <td>${row.avg}</td>
                <td>${row.posisi}</td>
                <td>${row.peluang}</td>
                <td>${row.persen}%</td>
            </tr>
        `;
    });

    html += `</tbody>`;
    table.innerHTML = html;

    const container = document.createElement('div');
    container.innerHTML = `<h3 style="margin-top:40px;">📋 Perbandingan Peluang Berdasarkan Distribusi Pesaing</h3>`;
    container.appendChild(table);

    document.getElementById('simulasiHasil').appendChild(container);
}


function getSchoolRanking() {
    // Hitung rata-rata nilai pendaftar tiap SMP berdasarkan jalur prestasi
    return Object.keys(kuotaSMP).map(smpKey => {
        let totalScore = 0;
        let totalCount = 0;

        rawData.forEach(row => {
            const avg = (row.rangeStart + row.rangeEnd) / 2;
            const count = row[smpKey] || 0; // ini data dari jalur prestasi
            totalScore += avg * count;
            totalCount += count;
        });

        return {
            key: smpKey,
            avg: totalCount > 0 ? totalScore / totalCount : 0
        };
    }).sort((a, b) => b.avg - a.avg); // urut dari rata-rata tertinggi
}




function simulasiDenganAsumsiDistribusi(nilaiKita, sekolahTujuanKey) {
    // Ranking SMP berdasarkan rata-rata nilai (kamu sudah punya datanya sebelumnya)
    const rankedSchools = getSchoolRanking(); // berisi [{ key: 'smp5', avg: 279.1 }, ...]
    
    // 1. Hitung semua siswa dengan nilai di atas kita (dari rawData.remaining)
    let totalPesaing = [];

    rawData.forEach(row => {
        const avg = (row.rangeStart + row.rangeEnd) / 2;
        if (avg > nilaiKita) {
            for (let i = 0; i < row.remaining; i++) {
                totalPesaing.push(avg); // anggap 1 siswa per item
            }
        }
    });

    // 2. Distribusikan siswa ini ke sekolah berdasarkan urutan ranking
    const alokasi = {}; // smpKey -> jumlah siswa
    rankedSchools.forEach(smp => alokasi[smp.key] = 0);

    let sisaPesaing = [...totalPesaing];

    for (const smp of rankedSchools) {
        const kuota = kuotaSMP[smp.key];
        const jumlahDialokasikan = Math.min(kuota, sisaPesaing.length);

        alokasi[smp.key] = jumlahDialokasikan;
        sisaPesaing = sisaPesaing.slice(jumlahDialokasikan);

        if (sisaPesaing.length === 0) break;
    }

    // 3. Hitung berapa banyak pesaing yang "masih tersisa" dan belum teralokasi
    const sisaPesaingTersisa = sisaPesaing.length;

    // 4. Hitung apakah sekolah tujuan kita sudah diisi atau belum
    const posisiDiTujuan = alokasi[sekolahTujuanKey] ?? 0;

    const peluang = posisiDiTujuan < kuotaSMP[sekolahTujuanKey] ? 'TINGGI ✅' : 'RENDAH ❌';

    return {
        alokasi,
        totalPesaing: totalPesaing.length,
        sisaPesaing: sisaPesaing.length,
        posisiDiTujuan,
        peluang
    };
}

const schoolNames = [
  "SMP 1", "SMP 2", "SMP 3", "SMP 4", "SMP 5",
  "SMP 6", "SMP 7", "SMP 8", "SMP 9", "SMP 10",
  "SMP 11", "SMP 12", "SMP 13", "SMP 14", "SMP 15", "SMP 16"
];

function getSchoolRanking() {
    return schoolNames.map((school, index) => {
        const key = `smp${index + 1}`;
        let totalScore = 0;
        let totalCount = 0;

        rawData.forEach(row => {
            const avg = (row.rangeStart + row.rangeEnd) / 2;
            const count = row[key] || 0;
            totalScore += avg * count;
            totalCount += count;
        });

        return {
            key,
            avg: totalCount > 0 ? totalScore / totalCount : 0
        };
    }).sort((a, b) => b.avg - a.avg);
}

