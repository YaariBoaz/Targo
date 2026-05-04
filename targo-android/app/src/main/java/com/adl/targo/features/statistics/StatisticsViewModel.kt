package com.adl.targo.features.statistics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.firebase.AuthRepository
import com.adl.targo.data.firebase.StatisticsRepository
import com.adl.targo.domain.model.UserStatistics
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StatisticsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val statisticsRepository: StatisticsRepository,
) : ViewModel() {

    private val _stats = MutableStateFlow<UserStatistics?>(null)
    val stats: StateFlow<UserStatistics?> = _stats.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        load()
    }

    fun load() {
        val uid = authRepository.currentUser?.uid ?: return
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _stats.value = runCatching { statisticsRepository.getStatistics(uid) }
                .onFailure { _error.value = it.message }
                .getOrElse { UserStatistics() }
            _isLoading.value = false
        }
    }
}
