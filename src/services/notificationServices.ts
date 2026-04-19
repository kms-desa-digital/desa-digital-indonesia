import { connectToDatabase } from '@/lib/db/mongodb'

export interface NotificationPayload {
  userId: string
  type: 'general' | 'personal'
  title: string
  description: string
  actionType: 'innovation_detail' | 'claim_detail' | 'profile' | 'dashboard'
  relatedId?: string | null
  actionUrl?: string | null
}

/**
 * Create a single notification
 */
export async function createNotification(payload: NotificationPayload): Promise<string | null> {
  try {
    const db = await connectToDatabase()

    const newNotification = {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      isRead: false,
      actionType: payload.actionType,
      relatedId: payload.relatedId || null,
      actionUrl: payload.actionUrl || null,
      createdAt: new Date(),
    }

    const result = await db.collection('notifications').insertOne(newNotification)
    return result.insertedId.toString()
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Create multiple notifications (for different recipients)
 */
export async function createNotificationBatch(
  notifications: NotificationPayload[]
): Promise<string[]> {
  try {
    const db = await connectToDatabase()

    const docs = notifications.map(payload => ({
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      description: payload.description,
      isRead: false,
      actionType: payload.actionType,
      relatedId: payload.relatedId || null,
      actionUrl: payload.actionUrl || null,
      createdAt: new Date(),
    }))

    const result = await db.collection('notifications').insertMany(docs)
    return Object.values(result.insertedIds).map(id => id.toString())
  } catch (error) {
    console.error('Error creating notification batch:', error)
    return []
  }
}

/**
 * Notify all admins about a specific event.
 * Cari admin di Firestore, lalu simpan notifikasi ke MongoDB.
 */
export async function notifyAllAdmins(payload: Omit<NotificationPayload, 'userId'>) {
  try {
    console.log("[notifyAllAdmins] === START ===");

    // 1. Inisialisasi Firebase Admin + Firestore
    const { getFirebaseAdminAuth } = await import('@/lib/firebase/admin')
    const { getFirestore } = await import('firebase-admin/firestore')
    const adminAuth = getFirebaseAdminAuth()
    const firestoreDb = getFirestore(adminAuth.app)
    console.log("[notifyAllAdmins] Firebase Admin initialized OK");

    // 2. Ambil SEMUA user dari Firestore dan filter yang role-nya admin
    const adminUids: string[] = []

    const snapshot = await firestoreDb.collection('users').get()
    console.log(`[notifyAllAdmins] Firestore users collection: ${snapshot.size} documents`);

    snapshot.forEach((doc) => {
      const data = doc.data()
      const role = (data.role || "").toString().toLowerCase().trim()
      console.log(`[notifyAllAdmins] Doc ${doc.id} → role: "${data.role}" (normalized: "${role}")`)

      if (role === 'admin') {
        // Gunakan doc.id sebagai UID utama (karena di Firestore, doc ID = Firebase UID)
        const uid = doc.id
        adminUids.push(uid)
        console.log(`[notifyAllAdmins] ✓ Admin found: ${uid}`)
      }
    })

    console.log(`[notifyAllAdmins] Total admin recipients: ${adminUids.length}`)

    if (adminUids.length === 0) {
      console.warn("[notifyAllAdmins] Tidak ada admin ditemukan di Firestore.")
      return []
    }

    // 3. Kirim notifikasi ke setiap admin via createNotification (menulis ke MongoDB)
    const results: (string | null)[] = []
    for (const uid of adminUids) {
      console.log(`[notifyAllAdmins] Sending notification to: ${uid}`)
      const result = await createNotification({
        ...payload,
        userId: uid,
      })
      console.log(`[notifyAllAdmins] Result for ${uid}: ${result ? 'OK' : 'FAILED'}`)
      results.push(result)
    }

    const successCount = results.filter(r => r !== null).length
    console.log(`[notifyAllAdmins] === DONE === (${successCount}/${adminUids.length} sent)`)
    return results.filter(r => r !== null) as string[]
  } catch (error) {
    console.error('[notifyAllAdmins] === ERROR ===', error)
    return []
  }
}

/**
 * Get innovator ID from innovation document
 */
export async function getInnovatorIdFromInnovation(innovationId: string): Promise<string | null> {
  try {
    const db = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const query: any = ObjectId.isValid(innovationId)
      ? { _id: new ObjectId(innovationId) }
      : { _id: innovationId }

    const innovation = await db.collection('innovations').findOne(query, {
      projection: { innovatorId: 1 },
    })

    return innovation?.innovatorId || null
  } catch (error) {
    console.error('Error getting innovator from innovation:', error)
    return null
  }
}

/**
 * Get village ID from claim document
 */
export async function getVillageIdFromClaim(claimId: string): Promise<string | null> {
  try {
    const db = await connectToDatabase()
    const { ObjectId } = await import('mongodb')

    const query: any = ObjectId.isValid(claimId)
      ? { _id: new ObjectId(claimId) }
      : { _id: claimId }

    const claim = await db.collection('claimInnovations').findOne(query, {
      projection: { desaId: 1 },
    })

    return claim?.desaId || null
  } catch (error) {
    console.error('Error getting village from claim:', error)
    return null
  }
}