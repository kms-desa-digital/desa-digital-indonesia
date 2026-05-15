import 'dotenv/config';
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from '../lib/firebase/admin';
import { connectToDatabase } from '../lib/db/mongodb';
import fs from 'fs';
import path from 'path';

async function listAllFirebaseUsers(nextPageToken?: string): Promise<any[]> {
    const auth = getFirebaseAdminAuth();
    const result = await auth.listUsers(1000, nextPageToken);
    let users = result.users.map(user => ({
        uid: user.uid,
        email: user.email || 'N/A',
        customClaimRole: (user.customClaims as any)?.role || null
    }));

    if (result.pageToken) {
        const nextUsers = await listAllFirebaseUsers(result.pageToken);
        users = users.concat(nextUsers);
    }

    return users;
}

async function main() {
    console.log('Fetching users and roles from all sources...');
    
    let db;
    try {
        db = await connectToDatabase();
    } catch (e) {
        console.warn('⚠️ Could not connect to MongoDB. Will fallback to Firestore/Auth claims.');
    }

    const firestore = getFirebaseAdminFirestore();
    
    try {
        const firebaseUsers = await listAllFirebaseUsers();
        console.log(`Found ${firebaseUsers.length} users in Firebase Auth.`);
        
        const finalUsers: any[] = [];

        for (const user of firebaseUsers) {
            let role = user.customClaimRole || 'no-role';
            let source = 'Custom Claims';

            // 1. Try MongoDB
            if (db && role === 'no-role') {
                const mongoUser = await db.collection('users').findOne({
                    $or: [
                        { uid: user.uid },
                        { firebaseUid: user.uid },
                        { email: user.email }
                    ]
                });
                if (mongoUser && mongoUser.role) {
                    role = mongoUser.role;
                    source = 'MongoDB';
                }
            }

            // 2. Try Firestore
            if (role === 'no-role') {
                try {
                    const userDoc = await firestore.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData?.role) {
                            role = userData.role;
                            source = 'Firestore';
                        }
                    }
                } catch (e) {
                    // Ignore firestore errors for specific docs
                }
            }

            finalUsers.push({
                email: user.email,
                role: role,
                source: source
            });
            
            process.stdout.write('.');
        }

        console.log('\n\n--- User List ---');
        console.log('Email'.padEnd(45), '| Role'.padEnd(15), '| Source');
        console.log('-'.repeat(80));
        
        const csvRows = ['email,role,source'];
        
        finalUsers.sort((a, b) => a.role.localeCompare(b.role)).forEach(u => {
            console.log(u.email.padEnd(45), '|', u.role.padEnd(15), '|', u.source);
            csvRows.push(`${u.email},${u.role},${u.source}`);
        });

        const outputPath = path.join(process.cwd(), 'src', 'scripts', 'generate-users-output.csv');
        fs.writeFileSync(outputPath, csvRows.join('\n'));
        
        console.log(`\nTotal users: ${finalUsers.length}`);
        console.log(`Results saved to: ${outputPath}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error listing users:', error);
        process.exit(1);
    }
}

main();

// Run with: npx tsx --env-file=.env.local src/scripts/generate-users.ts
