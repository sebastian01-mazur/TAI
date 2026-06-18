const pool = require('../db');
const bcrypt = require('bcrypt');

async function resetPassword() {
    try {
        const email = 'sebastian.mazur01@student.wat.edu.pl';
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('haslo123', salt);
        
        await pool.query("UPDATE users SET password_hash = $1 WHERE email = $2", [password_hash, email]);
        
        console.log("Password reset successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

resetPassword();
