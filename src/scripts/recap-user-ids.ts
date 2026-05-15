import 'dotenv/config';
import { getFirebaseAdminAuth } from '../lib/firebase/admin';
import fs from 'fs';
import path from 'path';

async function listAllFirebaseUsers(nextPageToken?: string): Promise<any[]> {
    const auth = getFirebaseAdminAuth();
    const result = await auth.listUsers(1000, nextPageToken);
    let users = result.users.map(user => ({
        uid: user.uid,
        email: user.email || 'N/A'
    }));

    if (result.pageToken) {
        const nextUsers = await listAllFirebaseUsers(result.pageToken);
        users = users.concat(nextUsers);
    }

    return users;
}

async function main() {
    console.log('Recapping user IDs from addUser.csv...');
    
    const csvPath = path.join(process.cwd(), 'src', 'scripts', 'addUser.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('Error: src/scripts/addUser.csv not found.');
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
    const header = lines[0].split(',').map(h => h.trim());
    const emailIndex = header.indexOf('email');
    const roleIndex = header.indexOf('role');

    if (emailIndex === -1) {
        console.error('Error: CSV must have an "email" column.');
        process.exit(1);
    }

    const inputUsers = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
            email: parts[emailIndex]?.trim(),
            role: roleIndex !== -1 ? parts[roleIndex]?.trim() : 'N/A'
        };
    });

    try {
        const firebaseUsers = await listAllFirebaseUsers();
        console.log(`Found ${firebaseUsers.length} users in Firebase Auth.`);
        
        const emailToUidMap = new Map();
        firebaseUsers.forEach(u => {
            if (u.email !== 'N/A') {
                emailToUidMap.set(u.email.toLowerCase(), u.uid);
            }
        });

        const recappedUsers: any[] = [];
        let foundCount = 0;

        for (const user of inputUsers) {
            const uid = emailToUidMap.get(user.email.toLowerCase()) || 'NOT_FOUND';
            if (uid !== 'NOT_FOUND') foundCount++;
            
            recappedUsers.push({
                email: user.email,
                uid: uid,
                role: user.role
            });
        }

        const outputCsvRows = ['email,uid,role'];
        recappedUsers.forEach(u => {
            outputCsvRows.push(`${u.email},${u.uid},${u.role}`);
        });

        const outputPath = path.join(process.cwd(), 'src', 'scripts', 'recap_addUser.csv');
        fs.writeFileSync(outputPath, outputCsvRows.join('\n'));
        
        console.log(`\nProcess completed.`);
        console.log(`Matched ${foundCount} out of ${inputUsers.length} users.`);
        console.log(`Results saved to: ${outputPath}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error recapping user IDs:', error);
        process.exit(1);
    }
}

main();
