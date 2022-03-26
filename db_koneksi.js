//const mysql=require('mysql');
//const connection = mysql.createConnection({
//    host:"localhost",
//    user:"root",
//    password:"rootpw",
//    database:"fe_presensi-pegawai",
//});
//module.exports = connection;

// meload module mysql
const mysql=require('mysql');
// Inisialisai pool-kolam
const connectionKeKolam=mysql.createPool({
    connectionLimit: 9999,
    host:'localhost',
    user:'meadmin',
    password:'toor#@5163SERVER',
    database:'presensi_pegawai',
    debug:false
});

module.exports=connectionKeKolam;