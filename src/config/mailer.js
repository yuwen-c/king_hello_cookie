const nodemailer = require('nodemailer');

const sendMail = (transaction_start ,transaction_end) => {
    // 創建一個可重用的 transporter 對象使用預設 SMTP 服務
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.email,
            pass: process.env.password
        }
    });

    // 設置郵件選項
    let mailOptions = {
        from: process.env.email,
        to: process.env.email,
        subject: '腳本執行完畢通知',
        text: `你的腳本已經執行完畢。交易序號範圍: ${transaction_start} - ${transaction_end}`
    };

    // 發送郵件
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('郵件發送失敗: ' + error);
        } else {
            console.log('郵件已發送: ' + info.response);
        }
    });
}

module.exports = sendMail;
