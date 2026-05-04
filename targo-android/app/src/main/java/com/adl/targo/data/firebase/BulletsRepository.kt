package com.adl.targo.data.firebase

import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BulletsRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
) {
    suspend fun getBulletCount(uid: String): Int {
        val snap = firestore.collection("userBullets").document(uid).get().await()
        return (snap.getLong("bulletCount") ?: 0L).toInt()
    }

    /** Returns false if not enough bullets. */
    suspend fun deductBullets(uid: String, amount: Int): Boolean {
        val ref = firestore.collection("userBullets").document(uid)
        return firestore.runTransaction { tx ->
            val snap = tx.get(ref)
            val current = (snap.getLong("bulletCount") ?: 0L).toInt()
            if (current < amount) return@runTransaction false
            tx.update(ref, "bulletCount", current - amount)
            true
        }.await()
    }
}
