package com.adl.targo.features.challenges

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.SelectedChallengeRepository
import com.adl.targo.data.firebase.AuthRepository
import com.adl.targo.data.firebase.ChallengeRepository
import com.adl.targo.domain.model.Challenge
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChallengesViewModel @Inject constructor(
    private val challengeRepository: ChallengeRepository,
    private val authRepository: AuthRepository,
    private val selectedChallengeRepository: SelectedChallengeRepository,
) : ViewModel() {

    private val _challenges = MutableStateFlow<List<Challenge>>(emptyList())
    val challenges: StateFlow<List<Challenge>> = _challenges.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        load()
    }

    fun selectChallenge(challenge: Challenge) {
        selectedChallengeRepository.selectedChallenge = challenge
    }

    fun load() {
        val uid = authRepository.currentUser?.uid ?: return
        viewModelScope.launch {
            _isLoading.value = true
            _challenges.value = runCatching {
                challengeRepository.getChallenges(uid)
            }.onFailure { Log.e("ChallengesVM", "load failed", it) }.getOrElse { emptyList() }
            _isLoading.value = false
        }
    }
}
