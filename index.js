//var http = require('http');
//var server = http.createServer(function(req, res) {
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    var message = 'It works!\n',
//        version = 'NodeJS ' + process.versions.node + '\n',
//        response = [message, version].join('\n');
//    res.end(response);
//});
//server.listen();

///Ini Page Index.js pada Tahap Pertama
const express=require('express');
const app=express();
const path=require('path');
//const connection = require('./db_koneksi');
const connectionKeKolam = require('./db_koneksi');
const bodyParser= require('body-parser');
const session = require('express-session');
const { log } = require('console');
const port=4500;

app.set('view engine','ejs');

app.listen(port,()=>{
    console.log('Sistem Presensi Pegawai v1.0.0 BE Dev berjalan pada server Localhost di port 4500');
});

//connection.connect((err, res)=>{
//    if (err) throw err;
//    console.log('Sistem BE Presensi Pegawai v1.0.0 Sudah Terhubung ke DBMS MySQL', res);
//});

exports.executeQuery=function(query,callback){
    connectionKeKolam.getConnection(function(err,connection){
        if (err) {
          connection.release();
          throw err;
          console.log('Sistem BE Presensi Pegawai v1.0.0 Sudah Terhubung ke DBMS MySQL', res);
        }   
        connection.query(query,function(err,rows){
            connection.release();
            if(!err) {
                callback(null, {rows: rows});
            }           
        });
        connection.on('error', function(err) {      
              throw err;
              return;     
        });
    });
};

app.use(session({
	secret: ['secret','veryimportantsecret','notsoimportantsecret','highlyprobablysecret'],
	name: "secretname",
	resave: true,
	saveUninitialized: true,
	cookie:{ maxAge: 600000 }// Session kadaluarsa setelah 10 menit=600.000 milisekon, 1 menit =60.000 milisekon
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(__dirname+'/be-epresensi-fix/public'));


app.get('/admin',(req,res)=>{
    return  res.redirect('/admin/beranda');
});

app.get('/admin/beranda',(req, res)=>{
     if (req.session.loggedin) {
         return  res.render('berandamenu',{idpegawai:req.session.idpegawai});
	}
    return  res.redirect('/admin/login');  
});

app.get('/admin/login',(req,res)=>{
    return res.render('loginadmin');
});

app.post('/admin/login', (req, res)=>{
    const idpegawai = req.body.idpegawai;
    const sandi = req.body.sandi;
    if (idpegawai && sandi) {    
    connectionKeKolam.query(
        `SELECT * FROM pegawai WHERE idpegawai="${idpegawai}" AND sandi="${sandi}"`, (err, results) =>{
            if (err) throw err;
            if(results.length){
                console.log('Anda berhasil Login sebagai ADMIN dengan idpegawai='+idpegawai);
                req.session.loggedin = true;
				req.session.idpegawai = idpegawai;
                return res.redirect('/admin');

            } else {
                console.log('Maaf Anda gagal Login sebagai ADMIN dengan idpegawai='+idpegawai);
                return res.redirect('/admin/login');
            }
            
        }
    );
}
});

app.get('/admin/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/admin/login');
    console.log('Anda berhasil Logout');
});

//Tahap Kedua
//-----------------------------------------------------Bagian Pegawai Awal-----------------------
app.get('/admin/pegawai',(req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
 connectionKeKolam.query('SELECT * FROM pegawai', (err, results) => {
    if(err) throw err
    res.render('pegawaiadmin', { idpegawai:req.session.idpegawai, pegawaiData: results, pegawaiDataDetail: {} });
  });
});

app.get('/admin/pegawai/:idpegawai',(req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    connectionKeKolam.query('SELECT * FROM pegawai', (err, results) => {
       if(err) throw err
       const pegawaiDataDetail = results.filter(function(data) { return data.idpegawai === req.params.idpegawai});
       res.render('pegawaiadmin', { idpegawai:req.session.idpegawai, pegawaiData: results, pegawaiDataDetail: pegawaiDataDetail[0] });
     })
   });

app.post('/admin/addpegawai', (req, res)=>{
    const idpegawai = req.body.idpegawai;
    const namapegawai = req.body.namapegawai;
    const jabatanpegawai = req.body.jabatanpegawai;
    const sandi = req.body.sandi;
    connectionKeKolam.query(
        `INSERT INTO pegawai (idpegawai,namapegawai,jabatanpegawai,sandi) VALUES ("${idpegawai}","${namapegawai}","${jabatanpegawai}","${sandi}")`, (err, results) =>{
            if (err) throw err;
            if(results.length=1){
                console.log('Input Data Pegawai berhasil dengan idpegawai='+idpegawai);
                res.redirect('/admin/pegawai');
            } else {
                console.log('Input Data Pegawai gagal dengan idpegawai='+idpegawai);
                res.redirect('/admin/pegawai');
            }
        }
    );
});

app.post('/admin/editpegawai', (req, res)=>{
    const idpegawai = req.body.idpegawai;
    const namapegawai = req.body.namapegawai;
    const jabatanpegawai = req.body.jabatanpegawai;
    const sandi = req.body.sandi;
    connectionKeKolam.query(
        `UPDATE pegawai SET namapegawai="${namapegawai}",jabatanpegawai="${jabatanpegawai}",sandi="${sandi}" WHERE idpegawai="${idpegawai}"`, (err, results) =>{
            if (err) throw err;
            if(results.length=1){
                console.log('Edit Data Pegawai berhasil dengan idpegawai='+idpegawai);
                res.redirect('/admin/pegawai');
            } else {
                console.log('Edit Data Pegawai gagal dengan idpegawai='+idpegawai);
                res.redirect('/admin/pegawai');
            }
        }
    );
});

app.get('/admin/deletepegawai/:idpegawai', (req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    const idpegawai = req.params.idpegawai;
    connectionKeKolam.query(
        `DELETE FROM pegawai WHERE idpegawai="${idpegawai}"`, (err, results) =>{
            if (err) throw err;
            if(results.length=1){
                console.log('Delete Data Pegawai berhasil dengan idpegawai='+idpegawai);
                res.redirect('/admin/pegawai');
            } else {
                console.log('Delete Data Pegawai gagal dengan idpegawai='+idpegawai);
                res.redirect('/admin/pegawai');
            }
        }
    );
});
//-----------------------------------------------------Bagian Pegawai Akhir-----------------------

//Tahap Ketiga
//-----------------------------------------------------Bagian Pengaturan Lokasi Awal-----------------------
app.get('/admin/pengaturan',(req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    connectionKeKolam.query('SELECT * FROM pengaturan', (err, results) => {
        if(err) throw err
        res.render('pengaturanadmin', { idpegawai:req.session.idpegawai, pengaturanData: results, pengaturanDataDetail: {} });
      });
});

app.get('/admin/pengaturan/:idpengaturan',(req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    connectionKeKolam.query('SELECT * FROM pengaturan', (err, results) => {
       if(err) throw err
       const pengaturanDataDetail = results.filter(function(data) { return data.idpengaturan === req.params.idpengaturan});
       res.render('pengaturanadmin', { idpegawai:req.session.idpegawai, pengaturanData: results, pengaturanDataDetail: pengaturanDataDetail[0] });
     })
   });


app.post('/admin/addpengaturan', (req, res)=>{
    const idpengaturan = req.body.idpengaturan;
    const namalokasi = req.body.namalokasi;
    const longitude = req.body.longitude;
    const latitude = req.body.latitude;
    const jarakpresensi = req.body.jarakpresensi;
    connectionKeKolam.query(
        `INSERT INTO pengaturan (idpengaturan,namalokasi,longitude,latitude,jarak_presensi) VALUES ("${pengaturan}","${namalokasi}","${longitude}","${latitude}","${jarakpresensi}")`, (err, results) =>{
            if (err) throw err;
            if(results.length=1){
                console.log('Input Data Pengaturan berhasil dengan idpengaturan='+idpengaturan);
                res.redirect('/admin/pengaturan');
            } else {
                console.log('Input Data Pengaturan gagal dengan idlpengaturan='+idpengaturan);
                res.redirect('/admin/pengaturan');
            }
        }
    );
});


app.post('/admin/editpengaturan', (req, res)=>{
    const idpengaturan = req.body.idpengaturan;
    const namalokasi = req.body.namalokasi;
    const longitude = req.body.longitude;
    const latitude = req.body.latitude;
    const jarakpresensi = req.body.jarakpresensi;
    connectionKeKolam.query(
        `UPDATE pengaturan SET namalokasi="${namalokasi}",longitude="${longitude}",latitude="${latitude}",jarak_presensi="${jarakpresensi}" WHERE idpengaturan="${idpengaturan}"`, (err, results) =>{
            if (err) throw err;
            if(results.length=1){
                console.log('Edit Data Pengaturan berhasil dengan idpengaturan='+idpengaturan);
                res.redirect('/admin/pengaturan');
            } else {
                console.log('Edit Data Pengaturan gagal dengan idpengaturan='+idpengaturan);
                res.redirect('/admin/pengaturan');
            }
        }
    );
});


app.get('/admin/deletepengaturan/:idpengaturan', (req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    const idpengaturan = req.params.idpengaturan;
    connectionKeKolam.query(
        `DELETE FROM pengaturan WHERE idpengaturan="${pengaturan}"`, (err, results) =>{
            if (err) throw err;
            if(results.length=1){
                console.log('Delete Data Pengaturan berhasil dengan idpengaturan='+idpengaturan);
                res.redirect('/admin/pengaturan');
            } else {
                console.log('Delete Data Pengaturan gagal dengan idpengaturan='+idpengaturan);
                res.redirect('/admin/pengaturan');
            }
        }
    );
});
//-----------------------------------------------------Bagian Pengaturan Lokasi Akhir-----------------------

//Tahap Keempat
//-----------------------------------------------------Bagian Laporan Awal-----------------------


app.get('/admin/laporan',(req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    connectionKeKolam.query('SELECT pegawai.idpegawai,pegawai.namapegawai,pegawai.jabatanpegawai,presensi.idpresensi,presensi.tglwaktu,presensi.longitude,presensi.latitude,presensi.jenis_presensi,presensi.sistem_kerja,presensi.foto FROM presensi,pegawai WHERE presensi.idpegawai=pegawai.idpegawai', (err, results) => {
       if(err) throw err
       res.render('laporanadmin', { idpegawai:req.session.idpegawai, laporanData: results, laporanDataDetail: {} });

    });
});
   
app.get('/admin/laporan/:idpresensi',(req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    connectionKeKolam.query('SELECT * FROM presensi', (err, results) => {
        if(err) throw err
        const laporanDataDetail = results.filter(function(data) { return data.idpresensi === req.params.idpresensi});
        res.render('laporanadmin', { idpegawai:req.session.idpegawai, laporanData: results, laporanDataDetail: laporanDataDetail[0] });
    });
});
   
app.get('/admin/deletelaporan/:idpresensi', (req, res)=>{
    if (!req.session.loggedin) return res.redirect('/admin');
    const idpresensi = req.params.idpresensi;
    connectionKeKolam.query(
        `DELETE FROM presensi WHERE idpresensi="${idpresensi}"`, (err, results) =>{
            if (err) throw err;
            if(results.length=1){
            console.log('Delete Data Presensi Pegawai berhasil dengan idpresensi='+idpresensi);
                res.redirect('/admin/laporan');
            } else {
            console.log('Delete Data Presensi Pegawai gagal dengan idpresensi='+idpresensi);
                res.redirect('/admin/laporan');
             }
        }
    );
});


app.post('/admin/searchlaporan', (req, res)=>{
    const idpegawai = req.body.idpegawai;
    const tglcari = req.body.tgl;
    connectionKeKolam.query(
`SELECT * FROM pegawai JOIN presensi ON pegawai.idpegawai=presensi.idpegawai AND pegawai.idpegawai="${idpegawai}" WHERE (presensi.tglwaktu>="${tglcari} 00:00:00" AND presensi.tglwaktu<="${tglcari} 23:59:59")`
, (err, results) =>{
            if (err) throw err;
            if(results.length){
                console.log(' Data berhasil ditemukan dengan idpegawai='+idpegawai);
                res.render('laporanadmin', { idpegawai:req.session.idpegawai, laporanData: results });
            } else {
                console.log('Maaf Data gagal ditemukan dengan idpegawai='+idpegawai);
                res.redirect('/admin/laporan');
            }
        }
    );
});

//-----------------------------------------------------Bagian Laporan Akhir-----------------------


