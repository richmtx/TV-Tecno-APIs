const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
    console.error('Uso: node scripts/generar-hash.js "TuPassword"');
    process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
    console.log('\nHash generado:\n');
    console.log(hash);
    console.log('\nCópialo y pégalo en tu INSERT de MySQL.\n');
});