package com.adl.targo.features.challenges.drills

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.DrillSetupRepository
import com.adl.targo.data.SelectedChallengeRepository
import com.adl.targo.data.firebase.AuthRepository
import com.adl.targo.data.firebase.ChallengeRepository
import com.adl.targo.domain.model.ALL_WEAPONS
import com.adl.targo.domain.model.Challenge
import com.adl.targo.domain.model.ChallengeDrill
import com.adl.targo.domain.model.DrillSetup
import com.adl.targo.domain.model.DrillStatus
import com.adl.targo.domain.model.ChallengeLeaderboardEntry
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class DrillStartResult {
    object Success : DrillStartResult()
    data class Error(val message: String) : DrillStartResult()
}

@HiltViewModel
class ChallengeDrillsViewModel @Inject constructor(
    private val challengeRepository: ChallengeRepository,
    private val drillSetupRepository: DrillSetupRepository,
    private val authRepository: AuthRepository,
    private val selectedChallengeRepository: SelectedChallengeRepository,
) : ViewModel() {

    private val _challenge = MutableStateFlow<Challenge?>(null)
    val challenge: StateFlow<Challenge?> = _challenge.asStateFlow()

    private val _drills = MutableStateFlow<List<ChallengeDrill>>(emptyList())
    val drills: StateFlow<List<ChallengeDrill>> = _drills.asStateFlow()

    private val _leaderboard = MutableStateFlow<List<ChallengeLeaderboardEntry>>(emptyList())
    val leaderboard: StateFlow<List<ChallengeLeaderboardEntry>> = _leaderboard.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _leaderboardLoading = MutableStateFlow(false)
    val leaderboardLoading: StateFlow<Boolean> = _leaderboardLoading.asStateFlow()

    private val _drillStartResult = MutableStateFlow<DrillStartResult?>(null)
    val drillStartResult: StateFlow<DrillStartResult?> = _drillStartResult.asStateFlow()

    val currentUid: String? get() = authRepository.currentUser?.uid

    fun load(challengeId: String) {
        val uid = authRepository.currentUser?.uid ?: return
        viewModelScope.launch {
            _isLoading.value = true
            val drills = runCatching {
                challengeRepository.getChallengeDrills(uid, challengeId)
            }.getOrElse { emptyList() }

            // Reconstruct a lightweight Challenge from drills context
            _drills.value = drills
            _isLoading.value = false
        }
    }

    fun setChallenge(challenge: Challenge) {
        _challenge.value = challenge
    }

    fun loadFromRepository() {
        selectedChallengeRepository.selectedChallenge?.let { setChallenge(it) }
    }

    fun loadLeaderboard(challengeId: String) {
        if (_leaderboard.value.isNotEmpty()) return
        viewModelScope.launch {
            _leaderboardLoading.value = true
            _leaderboard.value = runCatching {
                challengeRepository.getChallengeLeaderboard(challengeId)
            }.getOrElse { emptyList() }
            _leaderboardLoading.value = false
        }
    }

    fun onDrillClick(drill: ChallengeDrill, challengeId: String) {
        if (drill.status == DrillStatus.LOCKED) {
            _drillStartResult.value = DrillStartResult.Error("Complete the previous drill to unlock this one")
            return
        }
        val uid = authRepository.currentUser?.uid ?: run {
            _drillStartResult.value = DrillStartResult.Error("Please log in to start a drill")
            return
        }
        viewModelScope.launch {
            runCatching { challengeRepository.ensureChallengeStarted(uid, challengeId) }

            val weaponName = ALL_WEAPONS.find { it.id == drill.weaponType }?.name ?: drill.weaponName

            drillSetupRepository.currentSetup = DrillSetup(
                distance = drill.distance,
                weaponCategory = drill.weaponCategory,
                weaponType = drill.weaponType,
                weaponName = weaponName,
                numberOfBullets = drill.numberOfBullets,
                source = "challenge",
                challengeId = challengeId,
                challengeDrillId = drill.id,
                scoringCriteria = drill.scoringCriteria,
            )
            _drillStartResult.value = DrillStartResult.Success
        }
    }

    fun clearDrillResult() { _drillStartResult.value = null }
}
