package com.adl.targo.features.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.firebase.AuthRepository
import com.adl.targo.data.firebase.UserStatsRepository
import com.adl.targo.domain.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userStatsRepository: UserStatsRepository,
) : ViewModel() {

    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadUserProfile()
    }

    fun loadUserProfile() {
        val uid = authRepository.currentUser?.uid ?: return
        viewModelScope.launch {
            _isLoading.value = true
            runCatching { userStatsRepository.getUserProfile(uid) }
                .onSuccess { _userProfile.value = it }
                .onFailure { /* silently ignore — user may not have profile yet */ }
            _isLoading.value = false
        }
    }

    fun logout() {
        authRepository.logout()
    }
}
