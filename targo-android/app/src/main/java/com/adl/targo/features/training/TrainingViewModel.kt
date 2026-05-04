package com.adl.targo.features.training

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.adl.targo.data.DrillSetupRepository
import com.adl.targo.domain.model.ALL_WEAPONS
import com.adl.targo.domain.model.DrillSetup
import com.adl.targo.domain.model.WeaponType
import com.google.firebase.firestore.FirebaseFirestore
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

@HiltViewModel
class TrainingViewModel @Inject constructor(
    private val drillSetupRepository: DrillSetupRepository,
    private val firestore: FirebaseFirestore,
) : ViewModel() {

    val weapons: List<WeaponType> = ALL_WEAPONS

    var distance by mutableIntStateOf(50)
    var selectedCategory by mutableStateOf("pistol")
    var selectedWeapon by mutableStateOf("glock-19")
    var numberOfBullets by mutableIntStateOf(15)
    var currentTip by mutableStateOf("Choose fewer bullets for quick drills, or max out for endurance!")
        private set

    val filteredWeapons: List<WeaponType>
        get() = weapons.filter { it.category == selectedCategory }

    init {
        loadTip()
    }

    fun selectCategory(category: String) {
        selectedCategory = category
        selectedWeapon = filteredWeapons.firstOrNull()?.id ?: ""
    }

    /** Save setup to shared repository and return true if valid. */
    fun prepareStartDrill(): Boolean {
        if (distance <= 0 || numberOfBullets <= 0) return false
        val weapon = weapons.find { it.id == selectedWeapon }
        drillSetupRepository.currentSetup = DrillSetup(
            distance = distance,
            weaponCategory = selectedCategory,
            weaponType = selectedWeapon,
            weaponName = weapon?.name ?: "Unknown",
            numberOfBullets = numberOfBullets,
            source = "training",
        )
        return true
    }

    private fun loadTip() {
        viewModelScope.launch {
            try {
                val snap = firestore.collection("tips").get().await()
                if (!snap.isEmpty) {
                    val text = snap.documents.random().getString("text")
                    if (!text.isNullOrBlank()) currentTip = text
                }
            } catch (_: Exception) { /* keep default */ }
        }
    }
}
