const pool = require('../db');

async function checkUser() {
    try {
        const res = await pool.query("SELECT email FROM users WHERE email = 'sebastian.mazur01@student.wat.edu.pl'");
        if (res.rows.length > 0) {
            console.log("User exists!");
        } else {
            console.log("User DOES NOT exist.");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkUser();
