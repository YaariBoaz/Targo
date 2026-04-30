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
        val ref = firestore.collection("users").document(user.uid)
        val doc = ref.get().await()
        if (!doc.exists()) {
            // New user — create Firestore profile matching the Ionic app's schema
            ref.set(mapOf(
                "uid" to user.uid,
                "email" to (user.email ?: ""),
                "displayName" to displayName.ifBlank { user.displayName ?: "" },
                "photoURL" to (user.photoUrl?.toString() ?: ""),
                "shooterLevel" to "recruit",
                "createdAt" to com.google.firebase.Timestamp.now(),
                "updatedAt" to com.google.firebase.Timestamp.now(),
                "registeredDate" to com.google.firebase.Timestamp.now(),
                "lastLogin" to com.google.firebase.Timestamp.now(),
            )).await()
            // Create starter bullets in userBullets collection
            firestore.collection("userBullets").document(user.uid).set(mapOf(
                "bulletCount" to 50,
                "userId" to user.uid,
                "lastUpdated" to com.google.firebase.Timestamp.now(),
            )).await()
        } else {
            // Existing user — update auth fields and lastLogin only
            val updates = mutableMapOf<String, Any>(
                "lastLogin" to com.google.firebase.Timestamp.now(),
                "updatedAt" to com.google.firebase.Timestamp.now(),
            )
            if (!user.displayName.isNullOrBlank()) updates["displayName"] = user.displayName!!
            if (!user.photoUrl?.toString().isNullOrBlank()) updates["photoURL"] = user.photoUrl.toString()
            ref.update(updates).await()
        }
    }
}
