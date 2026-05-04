package com.adl.targo.data.firebase

import com.adl.targo.domain.model.UserProfile
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserStatsRepository @Inject constructor(
    private val firestore: FirebaseFirestore,
) {
    suspend fun getUserProfile(uid: String): UserProfile? {
        val doc = firestore.collection("users").document(uid).get().await()
        if (!doc.exists()) return null
        return UserProfile(
            uid = doc.getString("uid") ?: uid,
            email = doc.getString("email") ?: "",
            displayName = doc.getString("displayName") ?: "",
            photoURL = doc.getString("photoURL") ?: "",
            nickname = doc.getString("nickname") ?: doc.getString("displayName") ?: "",
            rank = doc.getString("rank") ?: "Rookie",
            bullets = (doc.getLong("bullets") ?: 0).toInt(),
            totalDrills = (doc.getLong("totalDrills") ?: 0).toInt(),
            avgHitRatio = doc.getDouble("avgHitRatio") ?: 0.0,
            avgScore = doc.getDouble("avgScore") ?: 0.0,
        )
    }
}
