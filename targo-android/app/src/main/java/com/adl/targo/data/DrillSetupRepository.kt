package com.adl.targo.data

import com.adl.targo.domain.model.Challenge
import com.adl.targo.domain.model.DrillSetup
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DrillSetupRepository @Inject constructor() {
    var currentSetup: DrillSetup? = null
}

@Singleton
class SelectedChallengeRepository @Inject constructor() {
    var selectedChallenge: Challenge? = null
}
