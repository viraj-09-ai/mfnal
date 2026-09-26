// File path: src/utils/badgeGenerator.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const badgesDir = path.join(__dirname, '..', '..', 'badges');
if (!fs.existsSync(badgesDir)) {
    fs.mkdirSync(badgesDir, { recursive: true });
}

/**
 * Generates a printable visitor badge PDF containing the visitor's photo,
 * details and their QR pass, and saves it to /backend/badges/<passId>.pdf
 * Returns the public static path (served via express.static) to the file.
 */
const generateBadge = ({ visitor, pass }) => {
    return new Promise((resolve, reject) => {
        try {
            const filePath = path.join(badgesDir, `${pass._id}.pdf`);
            const doc = new PDFDocument({ size: [320, 500], margin: 0 });
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Header banner
            doc.rect(0, 0, doc.page.width, 90).fill('#1e3a8a');
            doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
                .text('VISITOR PASS', 0, 30, { align: 'center' });
            doc.fontSize(9).font('Helvetica')
                .text('Please wear this badge visibly at all times', 0, 58, { align: 'center' });

            let cursorY = 110;

            // Visitor photo
            const photoBoxX = (doc.page.width - 100) / 2;
            if (visitor.photoUrl) {
                const photoPath = path.join(__dirname, '..', '..', visitor.photoUrl.replace(/^\//, ''));
                if (fs.existsSync(photoPath)) {
                    try {
                        doc.image(photoPath, photoBoxX, cursorY, { width: 100, height: 100, fit: [100, 100] });
                    } catch (imgErr) {
                        doc.rect(photoBoxX, cursorY, 100, 100).stroke();
                    }
                } else {
                    doc.rect(photoBoxX, cursorY, 100, 100).stroke();
                }
            } else {
                doc.rect(photoBoxX, cursorY, 100, 100).stroke();
                doc.fontSize(8).fillColor('#888').text('No Photo', photoBoxX, cursorY + 45, { width: 100, align: 'center' });
            }
            cursorY += 115;

            // Visitor details
            doc.fillColor('#111').fontSize(15).font('Helvetica-Bold')
                .text(visitor.name || 'Visitor', 20, cursorY, { width: doc.page.width - 40, align: 'center' });
            cursorY += 24;

            doc.fontSize(10).font('Helvetica').fillColor('#333');
            const detailLine = (label, value) => {
                doc.text(`${label}: ${value || '-'}`, 20, cursorY, { width: doc.page.width - 40, align: 'center' });
                cursorY += 15;
            };
            detailLine('Phone', visitor.phone);
            if (visitor.email) detailLine('Email', visitor.email);
            detailLine('Purpose', pass.purpose);
            detailLine('Valid Until', pass.validUntil ? new Date(pass.validUntil).toLocaleString() : '-');

            cursorY += 10;

            // QR Code
            if (pass.qrCodeUrl && pass.qrCodeUrl.startsWith('data:image')) {
                const base64Data = pass.qrCodeUrl.split(',')[1];
                const qrBuffer = Buffer.from(base64Data, 'base64');
                const qrSize = 140;
                const qrX = (doc.page.width - qrSize) / 2;
                doc.image(qrBuffer, qrX, cursorY, { width: qrSize, height: qrSize });
                cursorY += qrSize + 10;
            }

            doc.fontSize(8).fillColor('#888')
                .text(`Pass ID: ${pass._id}`, 20, cursorY, { width: doc.page.width - 40, align: 'center' });

            doc.end();

            stream.on('finish', () => resolve(`/badges/${pass._id}.pdf`));
            stream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = generateBadge;
