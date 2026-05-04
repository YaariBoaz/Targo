package com.adl.targo.features.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.firebase.AuthRepository
import com.adl.targo.data.firebase.HomeStatsRepository
import com.adl.targo.data.firebase.UserStatsRepository
import com.adl.targo.domain.model.HomeChallenge
import com.adl.targo.domain.model.HomeStats
import com.adl.targo.domain.model.ChallengeLeaderboardEntry
import com.adl.targo.domain.model.UserProfile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.launch
import java.util.Calendar
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val userStatsRepository: UserStatsRepository,
    private val homeStatsRepository: HomeStatsRepository,
) : ViewModel() {

    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile.asStateFlow()

    private val _homeStats = MutableStateFlow<HomeStats?>(null)
    val homeStats: StateFlow<HomeStats?> = _homeStats.asStateFlow()

    private val _challenges = MutableStateFlow<List<HomeChallenge>>(emptyList())
    val challenges: StateFlow<List<HomeChallenge>> = _challenges.asStateFlow()

    private val _leaderboard = MutableStateFlow<List<ChallengeLeaderboardEntry>>(emptyList())
    val leaderboard: StateFlow<List<ChallengeLeaderboardEntry>> = _leaderboard.asStateFlow()

    private val _topStreakHolder = MutableStateFlow<Pair<String, Int>?>(null)
    val topStreakHolder: StateFlow<Pair<String, Int>?> = _topStreakHolder.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    // Rotates daily — same challenge for everyone on the same calendar day
    val dailyChallenge: StateFlow<HomeChallenge?> = _challenges
        .map { list ->
            if (list.isEmpty()) null
            else list[Calendar.getInstance().get(Calendar.DAY_OF_YEAR) % list.size]
        }
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    init {
        loadAll()
    }

    fun loadAll() {
        val uid = authRepository.currentUser?.uid ?: return
        viewModelScope.launch {
            _isLoading.value = true
            val profileDeferred = async { runCatching { userStatsRepository.getUserProfile(uid) }.getOrNull() }
            val statsDeferred = async { runCatching { homeStatsRepository.getHomeStats(uid) }.getOrElse { HomeStats() } }
            val challengesDeferred = async { runCatching { homeStatsRepository.getChallenges(uid) }.getOrElse { emptyList() } }
            val leaderboardDeferred = async { runCatching { homeStatsRepository.getLeaderboard() }.getOrElse { emptyList() } }
            val topStreakDeferred = async { runCatching { homeStatsRepository.getTopStreakHolder() }.getOrNull() }

            _userProfile.value = profileDeferred.await()
            _homeStats.value = statsDeferred.await()
            _challenges.value = challengesDeferred.await()
            _leaderboard.value = leaderboardDeferred.await()
            _topStreakHolder.value = topStreakDeferred.await()
            _isLoading.value = false
        }
    }

    fun logout() {
        authRepository.logout()
    }
}
