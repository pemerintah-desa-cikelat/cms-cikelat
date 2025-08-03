// src/lib/db.js

import { Pool } from "pg";

// Inisialisasi pool koneksi sekali dan ekspor instance-nya.
// Semua bagian dari aplikasi akan menggunakan koneksi yang sama.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

export default pool;
