package com.adl.targo.data.firebase

import com.facebook.AccessToken
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.firebase.auth.FacebookAuthProvider
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
) {

    val currentUser: FirebaseUser? get() = auth.currentUser

    val authStateFlow: Flow<FirebaseUser?> = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { trySend(it.currentUser) }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun loginWithEmail(email: String, password: String): FirebaseUser {
        val result = auth.signInWithEmailAndPassword(email, password).await()
        return result.user!!
    }

    suspend fun registerWithEmail(email: String, password: String, displayName: String): FirebaseUser {
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        val user = result.user!!
        saveUserProfileIfNew(user, displayName)
        return user
    }

    suspend fun signInWithGoogle(account: GoogleSignInAccount): FirebaseUser {
        val credential = GoogleAuthProvider.getCredential(account.idToken, null)
        val result = auth.signInWithCredential(credential).await()
        val user = result.user!!
        saveUserProfileIfNew(user, user.displayName ?: "")
        return user
    }

    suspend fun signInWithFacebook(accessToken: AccessToken): FirebaseUser {
        val credential = FacebookAuthProvider.getCredential(accessToken.token)
        val result = auth.signInWithCredential(credential).await()
        val user = result.user!!
        saveUserProfileIfNew(user, user.displayName ?: "")
        return user
    }

    suspend fun resetPassword(email: String) {
        auth.sendPasswordResetEmail(email).await()
    }

    fun logout() {
        auth.signOut()
    }

    private suspend fun saveUserProfileIfNew(user: FirebaseUser, displayName: String) {
        val doc = firestore.collection("users").document(user.uid).get().await()
        if (!doc.exists()) {
            val profileData = mapOf(
                "uid" to user.uid,
                "email" to (user.email ?: ""),
                "displayName" to displayName.ifBlank { user.displayName ?: "" },
                "photoURL" to (user.photoUrl?.toString() ?: ""),
                "rank" to "Rookie",
                "bullets" to 50,
                "totalDrills" to 0,
                "avgHitRatio" to 0.0,
                "avgScore" to 0.0,
                "createdAt" to System.currentTimeMillis(),
            )
            firestore.collection("users").document(user.uid).set(profileData).await()
        }
    }
}
