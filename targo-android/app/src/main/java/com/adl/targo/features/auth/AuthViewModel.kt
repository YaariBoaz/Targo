package com.adl.targo.features.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.firebase.AuthRepository
import com.facebook.AccessToken
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.firebase.auth.FirebaseUser
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface AuthUiState {
    object Idle : AuthUiState
    object Loading : AuthUiState
    data class Success(val user: FirebaseUser) : AuthUiState
    data class Error(val message: String) : AuthUiState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = AuthUiState.Error("Email and password are required")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            runCatching { authRepository.loginWithEmail(email.trim(), password) }
                .onSuccess { _uiState.value = AuthUiState.Success(it) }
                .onFailure { _uiState.value = AuthUiState.Error(mapFirebaseError(it.message)) }
        }
    }

    fun register(email: String, password: String, displayName: String) {
        if (email.isBlank() || password.isBlank()) {
            _uiState.value = AuthUiState.Error("Email and password are required")
            return
        }
        if (password.length < 6) {
            _uiState.value = AuthUiState.Error("Password must be at least 6 characters")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            runCatching { authRepository.registerWithEmail(email.trim(), password, displayName.trim()) }
                .onSuccess { _uiState.value = AuthUiState.Success(it) }
                .onFailure { _uiState.value = AuthUiState.Error(mapFirebaseError(it.message)) }
        }
    }

    fun handleGoogleSignInResult(account: GoogleSignInAccount?) {
        if (account == null) {
            _uiState.value = AuthUiState.Error("Google sign-in was cancelled")
            return
        }
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            runCatching { authRepository.signInWithGoogle(account) }
                .onSuccess { _uiState.value = AuthUiState.Success(it) }
                .onFailure { _uiState.value = AuthUiState.Error(mapFirebaseError(it.message)) }
        }
    }

    fun handleFacebookAccessToken(token: AccessToken) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            runCatching { authRepository.signInWithFacebook(token) }
                .onSuccess { _uiState.value = AuthUiState.Success(it) }
                .onFailure { _uiState.value = AuthUiState.Error(mapFirebaseError(it.message)) }
        }
    }

    fun resetPassword(email: String, onSent: () -> Unit, onError: (String) -> Unit) {
        if (email.isBlank()) {
            onError("Email is required")
            return
        }
        viewModelScope.launch {
            runCatching { authRepository.resetPassword(email.trim()) }
                .onSuccess { onSent() }
                .onFailure { onError(mapFirebaseError(it.message)) }
        }
    }

    fun clearError() {
        if (_uiState.value is AuthUiState.Error) _uiState.value = AuthUiState.Idle
    }

    private fun mapFirebaseError(message: String?): String = when {
        message == null -> "Authentication failed"
        "INVALID_LOGIN_CREDENTIALS" in message || "no user record" in message.lowercase() ->
            "No account found with this email"
        "wrong-password" in message || "INVALID_PASSWORD" in message -> "Incorrect password"
        "email-already-in-use" in message || "EMAIL_EXISTS" in message ->
            "An account with this email already exists"
        "weak-password" in message -> "Password should be at least 6 characters"
        "invalid-email" in message || "INVALID_EMAIL" in message -> "Invalid email address"
        "too-many-requests" in message -> "Too many attempts. Please try again later"
        "12501" in message -> "Google sign-in was cancelled"
        "DEVELOPER_ERROR" in message || "10:" in message ->
            "Google sign-in config error. Check SHA-1 fingerprint in Firebase Console."
        else -> message
    }
}
