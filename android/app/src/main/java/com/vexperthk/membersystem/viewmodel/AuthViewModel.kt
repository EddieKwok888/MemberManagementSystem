package com.vexperthk.membersystem.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
import com.vexperthk.membersystem.data.SystemSettings
import com.vexperthk.membersystem.data.User
import com.vexperthk.membersystem.repository.AuthRepository
import com.vexperthk.membersystem.repository.SystemRepository
import com.vexperthk.membersystem.repository.UserRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AuthViewModel(
    private val authRepository: AuthRepository = AuthRepository(),
    private val userRepository: UserRepository = UserRepository(),
    private val systemRepository: SystemRepository = SystemRepository()
) : ViewModel() {

    val currentUser: StateFlow<FirebaseUser?> = authRepository.currentUser

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val userDoc: StateFlow<User?> = currentUser.flatMapLatest { user ->
        if (user != null) {
            userRepository.observeUser(user.uid)
        } else {
            flowOf(null)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val systemSettings: StateFlow<SystemSettings?> = systemRepository.observeSettings()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val isLoggedIn: StateFlow<Boolean> = combine(currentUser) { (user) ->
        user != null
    }.stateIn(viewModelScope, SharingStarted.Eagerly, false)

    val userStatus: StateFlow<String?> = combine(userDoc) { (user) ->
        user?.status ?: if (currentUser.value != null) "pending" else null
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val isAdmin: StateFlow<Boolean> = combine(userDoc) { (user) ->
        user?.role == "admin"
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val isMaintenanceMode: StateFlow<Boolean> = combine(systemSettings, isAdmin) { settings, admin ->
        settings?.maintenanceMode == true && !admin
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val isInitialized: StateFlow<Boolean> = combine(systemSettings, currentUser, userDoc) { settings, user, doc ->
        val settingsLoaded = settings != null
        val userCheck = if (user != null) doc != null else true
        settingsLoaded && userCheck
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    fun logout() {
        authRepository.logout()
    }
}
