var mysql = require("mysql2");
var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
var session = require('express-session');
const { render, redirect } = require("express/lib/response");
const fs = require('fs');
const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const QRCode = require('qrcode');

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "final1"
});

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs');

app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true
    })
);

//5 body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    next();
}

app.use((req, res, next) => {
    res.locals.user = req.session.user || null; // ถ้าไม่มี user ใน session ให้ส่ง null
    next();
});

// ฟังก์ชันสำหรับส่งอีเมล
function sendmail(toemail, subject, html) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        service: 'gmail',
        auth: {
            user: 'sunphupha12345@gmail.com', // อีเมลของคุณ
            pass: 'vpnllumwwtomoien'    // รหัสผ่านสำหรับแอป (App Password)
        }
    });

    const mailOptions = {
        from: '"Weed Inc." <"weedinc"@gmail.com>', // ชื่อผู้ส่ง
        to: toemail,                               // อีเมลผู้รับ
        subject: subject,                          // หัวข้ออีเมล
        html: html                                 // เนื้อหาในรูปแบบ HTML
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent successfully:", info.response);
        }
    });
}

app.get("/", (req, res) => {
    res.render("age_verification.ejs");
});

// Handle age verification
app.post("/verify-age", (req, res) => {
    const isOver20 = req.body.age_verified === "true";

    if (isOver20) {
        req.session.ageVerified = true; // Mark the user as age-verified
        res.redirect("/home");
    } else {
        res.status(403).send("You cannot access this website because you are under 20.");
    }
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'signup.html'));
})

app.post("/signup", (req, res) => {
    const { full_name, email, password, retypePassword, date_of_birth, phone_number, gender, ageVerified } = req.body;

    // Validate in API (หากมีข้อมูลที่ไม่ได้ผ่านการตรวจสอบจาก client)
    if (password !== retypePassword) {
        return res.status(400).send("Passwords do not match.");
    }

    // เข้ารหัสรหัสผ่าน
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            console.error("Error generating salt:", err);
            return res.status(500).send("Server error occurred.");
        }

        bcrypt.hash(password, salt, (err, hash) => {
            if (err) {
                console.error("Error hashing password:", err);
                return res.status(500).send("Server error occurred.");
            }

            // ข้อมูลผู้ใช้ใหม่
            const newUser = {
                full_name,
                email,
                password: hash, // เก็บรหัสผ่านที่เข้ารหัส
                date_of_birth,
                phone_number,
                gender,
            };

            // เพิ่มข้อมูลลงในฐานข้อมูล
            connection.query("INSERT INTO users SET ?", newUser, (err) => {
                if (err) {
                    console.error("Error inserting user:", err);
                    return res.status(500).send("Error occurred while registering user.");
                }

                console.log("User registered successfully:", email);
                res.redirect("/login");
            });
        });
    });
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'));
});

app.post("/auth", function(req, res) {
    const { email, password } = req.body;

    // ตรวจสอบว่า email และ password ถูกส่งมาหรือไม่
    if (email && password) {
        connection.query("SELECT * FROM users WHERE email = ?", [email], function(err, results) {
            if (err) {
                console.error("Database error:", err);
                return res.send('เกิดข้อผิดพลาดในระบบ');
            }

            if (results.length > 0) {
                // เปรียบเทียบรหัสผ่าน
                bcrypt.compare(password, results[0].password, function(err, isMatch) {
                    if (err) {
                        console.error("Bcrypt error:", err);
                        return res.send('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
                    }

                    if (isMatch) { // ถ้า password ตรงกัน
                        req.session.loggedin = true;
                        req.session.userID = results[0].id;
                        req.session.user = results[0]; // เก็บข้อมูลผู้ใช้ทั้งหมด

                        console.log("User logged in successfully:", email);
                        res.redirect("/home");  // เมื่อผู้ใช้ล็อกอินสำเร็จจะไปที่หน้า home
                    } else { // ถ้า password ไม่ตรงกัน
                        res.send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
                    }
                });
            } else {
                res.send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
            }
        });
    } else {
        res.send('โปรดใส่ข้อมูลให้ครบถ้วน!!');
    }
});

app.get("/userAccount", isAuthenticated, (req, res) => {
    const userIdentifier = req.session.userID; // ใช้ session ดึง user identifier (email หรือ id)

    const query = `
        SELECT 
            full_name, 
            DATE_FORMAT(date_of_birth, '%d/%m/%Y') AS formatted_date, 
            gender, 
            email, 
            phone_number, 
            password 
        FROM users 
        WHERE email = ? OR id = ?
    `;

    connection.query(query, [userIdentifier, userIdentifier], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).send("Error fetching user data");
        }

        if (results.length > 0) {
            res.render("userAccount", {
                user: results[0] // ส่งข้อมูลผู้ใช้ไปยังหน้า ejs
            });
        } else {
            res.status(404).send("User not found");
        }
    });
});



app.post("/reset-password", (req, res) => {
    const userId = req.session.user.id;

    connection.query("SELECT email FROM users WHERE id = ?", [userId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.json({ success: false, error: "Database error" });
        }

        if (results.length === 0) {
            return res.json({ success: false, error: "User not found" });
        }

        const userEmail = results[0].email;
        const randomPassword = Math.random().toString(36).slice(-8); // สร้างรหัสผ่านใหม่แบบสุ่ม
        const hashedPassword = bcrypt.hashSync(randomPassword, 10); // แฮชรหัสผ่านใหม่

        // อัปเดตรหัสผ่านใหม่ในฐานข้อมูล
        connection.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId], (err) => {
            if (err) {
                console.error("Error updating password:", err);
                return res.json({ success: false, error: "Database error" });
            }

            // ส่งอีเมลแจ้งรหัสผ่านใหม่
            const subject = "Your Password Has Been Reset";
            const html = `
                <p>Hello,</p>
                <p>Your password has been reset as requested. Your new password is:</p>
                <p><strong>${randomPassword}</strong></p>
                <p>Please log in using this password and change it immediately.</p>
                <p>Thank you,</p>
                <p>Weed Inc. Support Team</p>
            `;
            sendmail(userEmail, subject, html);

            res.json({ success: true });
        });
    });
});

app.post("/change-password", async (req, res) => {
    const userId = req.session.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.json({ success: false, error: "Missing required fields" });
    }

    try {
        const [results] = await connection.promise().query("SELECT password, email FROM users WHERE id = ?", [userId]);

        if (results.length === 0) {
            return res.json({ success: false, error: "User not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, results[0].password);
        if (!isMatch) {
            return res.json({ success: false, error: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await connection.promise().query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

        // ส่งอีเมลแจ้งการเปลี่ยนรหัสผ่าน
        const subject = "Password Changed Successfully";
        const html = `
            <p>Hello,</p>
            <p>Your password has been successfully changed.</p>
            <p>If you did not request this change, please contact support immediately.</p>
            <p>Thank you,</p>
            <p>Weed Inc. Support Team</p>
        `;
        sendmail(results[0].email, subject, html);

        res.json({ success: true });
    } catch (err) {
        console.error("Error changing password:", err);
        res.json({ success: false, error: "Server error" });
    }
});

app.get('/check-login', (req, res) => {
    if (req.session.loggedin) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});


app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('เกิดข้อผิดพลาดในการออกจากระบบ');
        }
        res.redirect('/home'); // เปลี่ยนเส้นทางไปหน้าแรกหรือหน้าอื่นๆ
    });
});

app.get('/cannabis', (req, res) => {
    const { search = '', strainType = '', thc = '', cbd = '', effect = '' } = req.query;

    let query = `
        SELECT 
            cannabis_strains.id,
            cannabis_strains.name,
            cannabis_strains.main_url,
            cannabis_strains.type,
            cannabis_strains.effect,
            cannabis_strains.THC_percentage,
            cannabis_strains.CBD_percentage,
            cannabis_strains.price, /* เพิ่ม price */
            IFNULL(AVG(ratings.rating), 0) AS average_rating, 
            COUNT(ratings.rating) AS total_ratings 
        FROM 
            cannabis_strains 
        LEFT JOIN 
            ratings ON cannabis_strains.id = ratings.cannabis_id 
        WHERE 1=1
    `;
    const queryParams = [];

    // เงื่อนไขสำหรับค้นหา
    if (search) {
        query += ' AND cannabis_strains.name LIKE ?';
        queryParams.push(`%${search}%`);
    }

    if (strainType) {
        query += ' AND cannabis_strains.type LIKE ?';
        queryParams.push(`%${strainType}%`);
    }

    if (effect) {
        query += ' AND cannabis_strains.effect LIKE ?';
        queryParams.push(`%${effect}%`);
    }
    
    query += ' GROUP BY cannabis_strains.id';

    // ตัวกรอง THC
    if (thc) {
        if (thc === 'desc') {
            query += ' ORDER BY THC_percentage DESC';
        } else if (thc === 'asc') {
            query += ' ORDER BY THC_percentage ASC';
        }
    }

    // ตัวกรอง CBD
    if (cbd) {
        if (cbd === 'desc') {
            query += ' ORDER BY CBD_percentage DESC';
        } else if (cbd === 'asc') {
            query += ' ORDER BY CBD_percentage ASC';
        }
    }

    // Query ข้อมูล
    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Database error');
        }

        // ส่งข้อมูลไปยัง cannabis_list.ejs
        res.render('cannabis_list', { cannabisStrains: results });
    });
});

// ดึงข้อมูลทั้งหมดจาก table cannabis_strains
app.get("/cannabis-list", (req, res) => {
    const query = `
        SELECT 
            id, 
            name, 
            main_url, 
            type, 
            effect, 
            THC_percentage, 
            CBD_percentage, 
            price /* รวม price */
        FROM 
            cannabis_strains
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            return res.status(500).send('Database error');
        }
        res.render("cannabis_list", { cannabisList: results });
    });
});

app.get("/cannabis/:id", (req, res) => {
    const cannabisId = req.params.id;

    const strainQuery = `
        SELECT cannabis_strains.*, 
               IFNULL(AVG(ratings.rating), 0) AS average_rating, 
               COUNT(ratings.rating) AS total_ratings 
        FROM cannabis_strains 
        LEFT JOIN ratings ON cannabis_strains.id = ratings.cannabis_id 
        WHERE cannabis_strains.id = ? 
        GROUP BY cannabis_strains.id
    `;

    const commentsQuery = `
        SELECT comments.text, users.full_name AS user_name 
        FROM comments 
        INNER JOIN users ON comments.user_id = users.id 
        WHERE comments.cannabis_id = ?
    `;

    connection.query(strainQuery, [cannabisId], (err, strainResults) => {
        if (err) return res.status(500).send("Database error");

        connection.query(commentsQuery, [cannabisId], (err, commentsResults) => {
            if (err) return res.status(500).send("Database error");

            res.render("cannabis_detail", {
                cannabis: strainResults[0],
                comments: commentsResults,
                user: req.session.user || null,
            });
        });
    });
});

app.post('/rate', async (req, res) => {
    const { user_id, cannabis_id, rating } = req.body;

    if (!user_id || !cannabis_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid input data' });
    }

    try {
        // ตรวจสอบว่าผู้ใช้เคยให้คะแนนสายพันธุ์นี้หรือไม่
        const existingRating = await db.query(
            'SELECT * FROM ratings WHERE user_id = ? AND cannabis_id = ?',
            [user_id, cannabis_id]
        );

        if (existingRating.length > 0) {
            // อัปเดตคะแนน
            await db.query(
                'UPDATE ratings SET rating = ? WHERE user_id = ? AND cannabis_id = ?',
                [rating, user_id, cannabis_id]
            );
        } else {
            // เพิ่มคะแนนใหม่
            await db.query(
                'INSERT INTO ratings (user_id, cannabis_id, rating) VALUES (?, ?, ?)',
                [user_id, cannabis_id, rating]
            );
        }

        res.json({ success: true, message: 'Rating submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: ดึงคะแนนเฉลี่ยของสายพันธุ์
app.get('/ratings/:cannabis_id', async (req, res) => {
    const { cannabis_id } = req.params;

    try {
        const result = await db.query(
            'SELECT AVG(rating) AS average_rating, COUNT(*) AS total_ratings FROM ratings WHERE cannabis_id = ?',
            [cannabis_id]
        );

        res.json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post("/cannabis/:id/rate", requireLogin, (req, res) => {
    const cannabisId = req.params.id;
    const userId = req.session.user?.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Invalid rating input" });
    }

    if (!userId) {
        return res.status(401).json({ error: "You must be logged in to rate this strain." });
    }

    const query = `
        INSERT INTO ratings (user_id, cannabis_id, rating)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = ?
    `;

    connection.query(query, [userId, cannabisId, rating, rating], (err) => {
        if (err) {
            console.error("Error updating rating:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({ success: true, message: "Rating submitted successfully" });
    });
});

app.post("/cannabis/:id/comment", requireLogin, (req, res) => {
    const cannabisId = req.params.id;
    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Invalid comment input" });
    }

    const userId = req.session.user.id;

    const query = `
        INSERT INTO comments (user_id, cannabis_id, text)
        VALUES (?, ?, ?)
    `;

    connection.query(query, [userId, cannabisId, text], (err) => {
        if (err) {
            console.error("Error adding comment:", err);
            return res.status(500).json({ error: "Database error" });
        }

        res.json({ success: true, message: "Comment added successfully" });
    });
});

// เพิ่มสินค้าใน Cart
app.post("/cart/add", (req, res) => {
    const { id, name, price } = req.body;
    if (!req.session.cart) req.session.cart = [];

    const existingItem = req.session.cart.find((item) => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        req.session.cart.push({ id, name, price, quantity: 1 });
    }

    res.json({ success: true, cartCount: req.session.cart.length });
});

// API: ดูสินค้าใน Cart (JSON)
app.get("/api/cart", (req, res) => {
    res.json(req.session.cart || []);
});

// เรนเดอร์หน้า Cart
app.get("/cart", (req, res) => {
    res.render("cart");
});

// ลบสินค้าใน Cart
app.post("/cart/remove", (req, res) => {
    const { id } = req.body;

    if (!req.session.cart) {
        return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    req.session.cart = req.session.cart.filter((item) => item.id !== id);
    res.json({ success: true, cartCount: req.session.cart.length });
});

app.post('/checkout', (req, res) => {
    const { recipient_name, address, cart, total } = req.body;
    const userId = req.session.user.id;

    // คำนวณยอดรวม
    const orderTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // สร้างคำสั่งซื้อ
    const query = `INSERT INTO orders (user_id, recipient_name, address, total) VALUES (?, ?, ?, ?)`;

    connection.query(query, [userId, recipient_name, address, orderTotal], (err, result) => {
        if (err) {
            console.error('Error creating order:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        const orderId = result.insertId;

        // เพิ่มข้อมูลสินค้าใน order_items
        const items = cart.map(item => [orderId, item.id, item.quantity, item.price]);
        const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?`;

        connection.query(itemQuery, [items], (err) => {
            if (err) {
                console.error('Error adding order items:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // ส่ง QR Code เดิมกลับไป
            res.json({ 
                success: true, 
                qrCodeUrl: '/qrcodes/qrcode.jpg' // URL ของ QR Code ที่ต้องการใช้ซ้ำ
            });
        });
    });
});

app.post('/buy-now/checkout', (req, res) => {
    const { recipient_name, address, product_id, total } = req.body;
    console.log("Incoming Data:", req.body);

    if (!recipient_name || !address || !product_id || !total) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    const userId = req.session.user?.id || null; // ตรวจสอบว่า User ล็อกอินหรือไม่
    if (!userId) {
        return res.status(401).json({ error: "User not logged in." });
    }

    const orderQuery = `INSERT INTO orders (user_id, recipient_name, address, total) VALUES (?, ?, ?, ?)`;

    connection.query(orderQuery, [userId, recipient_name, address, total], (err, orderResult) => {
        if (err) {
            console.error("Error creating order:", err);
            return res.status(500).json({ error: "Database error" });
        }

        const orderId = orderResult.insertId;
        const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`;

        connection.query(itemQuery, [orderId, product_id, 1, total], (err) => {
            if (err) {
                console.error("Error adding order items:", err);
                return res.status(500).json({ error: "Database error" });
            }

            const qrCodeUrl = `/qrcodes/qrcode.jpg`; // ใช้ QR Code เดิม
            res.json({ success: true, qrCodeUrl });
        });
    });
});

// Middleware to check age verification
function isAuthenticated(req, res, next) {
    if (req.session.ageVerified) {
        return next(); // User is age-verified, proceed to the next handler
    } else {
        res.redirect("/"); // Redirect to age verification page if not verified
    }
}

// Serve home page
app.get('/home', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/home.html"));
});

app.get('/Cannabis101', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/cannabis101.html"));
});

app.get('/HowToUse', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/howtouse.html"));
});

app.get('/News', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/news.html"));
});

app.get('/FAQ', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/faq.html"));
});

app.get('/ContactUs', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/contact.html"));
});

app.get('/News1', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/news1.html"));
});

app.get('/News2', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/news2.html"));
});

app.get('/News3', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/news3.html"));
});

app.get('/News4', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/news4.html"));
});

app.get('/News5', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/news5.html"));
});

app.get('/News6', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/news6.html"));
});

app.get('/THC', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/THC.html"));
});

app.get('/CBD', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/CBD.html"));
});

app.get('/Politics', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/politics.html"));
});

app.get('/Health', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/Health.html"));
});

app.get('/420', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/420.html"));
});

app.get('/Lifestyle', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/Lifestyle.html"));
});

app.get('/ScienceNTech', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/Science_Tech.html"));
});

app.get('/Cannabis101_content', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname + "/public/html/cannabis101_content.html"));
});

app.use(express.static('public'));

app.listen(4000);
console.log("running on port 4000...");