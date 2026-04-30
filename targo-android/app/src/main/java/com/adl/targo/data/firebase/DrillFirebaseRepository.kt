package com.adl.targo.data.firebase

import com.adl.targo.domain.model.DrillState
import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

private const val TEST_UID = "PMqgPfRbCChoPs7mO7As3yLzWzo2"

@Singleton
class DrillFirebaseRepository @Inject constructor(
    private val firestore: FirebaseFirestore
) {
    suspend fun saveDrillSession(state: DrillState) {
        val shotMaps = state.shots.map { shot ->
            mapOf(
                "x" to shot.x,
                "y" to shot.y,
                "shotNumber" to shot.shotNumber,
                "timestamp" to shot.timestamp
            )
        }
        val doc = mapOf(
            "shooterName" to state.shooterName,
            "shots" to shotMaps,
            "totalTime" to state.elapsedMs,
            "timestamp" to Timestamp.now()
        )
        firestore
            .collection("users")
            .document(TEST_UID)
            .collection("lahav-sessions")
            .add(doc)
            .await()
    }
}
