import { connectToDatabase } from '@/lib/db/mongodb'

export interface NotificationPayload {
  userId: string
  type: 'general' | 'personal'
  category?: 'ranking' | 'announcement' | 'innovation_recommendation' | 'new_innovator' | 'submission_status'
  title: string
  description: string
  actionType: 'innovation_detail' | 'claim_detail' | 'profile' | 'dashboard' | 'notification_detail'
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
      category: payload.category || (payload.type === 'personal' ? 'submission_status' : 'announcement'),
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
      category: payload.category || (payload.type === 'personal' ? 'submission_status' : 'announcement'),
      title: payload.title,
      description: payload.description,
      isRead: false,
      actionType: payload.actionType,
      relatedId: payload.relatedId || null,
      actionUrl: payload.actionUrl || null,
      createdAt: new Date(),
    }))

    if (docs.length === 0) return []

    const result = await db.collection('notifications').insertMany(docs)
    return Object.values(result.insertedIds).map(id => id.toString())
  } catch (error) {
    console.error('Error creating notification batch:', error)
    return []
  }
}

/**
 * Notify all users of a specific role
 */
export async function notifyRole(role: string, payload: Omit<NotificationPayload, 'userId'>) {
  try {
    const { getFirebaseAdminAuth } = await import('@/lib/firebase/admin')
    const { getFirestore } = await import('firebase-admin/firestore')
    const adminAuth = getFirebaseAdminAuth()
    const firestoreDb = getFirestore(adminAuth.app)

    const userUids: string[] = []
    const snapshot = await firestoreDb.collection('users').where('role', '==', role).get()

    snapshot.forEach((doc) => {
      userUids.push(doc.id)
    })

    if (userUids.length === 0) return []

    const notifications = userUids.map(uid => ({
      ...payload,
      userId: uid,
    })) as NotificationPayload[]

    return await createNotificationBatch(notifications)
  } catch (error) {
    console.error(`Error notifying role ${role}:`, error)
    return []
  }
}

/**
 * Notify all users (except specific role if needed)
 */
export async function notifyAll(payload: Omit<NotificationPayload, 'userId'>) {
  try {
    const { getFirebaseAdminAuth } = await import('@/lib/firebase/admin')
    const { getFirestore } = await import('firebase-admin/firestore')
    const adminAuth = getFirebaseAdminAuth()
    const firestoreDb = getFirestore(adminAuth.app)

    const userUids: string[] = []
    const snapshot = await firestoreDb.collection('users').get()

    snapshot.forEach((doc) => {
      userUids.push(doc.id)
    })

    if (userUids.length === 0) return []

    const notifications = userUids.map(uid => ({
      ...payload,
      userId: uid,
    })) as NotificationPayload[]

    return await createNotificationBatch(notifications)
  } catch (error) {
    console.error('Error notifying all users:', error)
    return []
  }
}

/**
 * Notify all admins about a specific event.
 */
export async function notifyAllAdmins(payload: Omit<NotificationPayload, 'userId'>) {
  return await notifyRole('admin', payload)
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