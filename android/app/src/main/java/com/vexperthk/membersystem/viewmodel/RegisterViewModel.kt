package com.vexperthk.membersystem.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vexperthk.membersystem.repository.AuthRepository
import com.vexperthk.membersystem.repository.SystemRepository
import com.vexperthk.membersystem.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class RegisterViewModel(
    private val authRepository: AuthRepository = AuthRepository(),
    private val userRepository: UserRepository = UserRepository(),
    private val systemRepository: SystemRepository = SystemRepository()
) : ViewModel() {

    private val _displayName = MutableStateFlow("")
    val displayName: StateFlow<String> = _displayName

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password

    private val _error = MutableStateFlow("")
    val error: StateFlow<String> = _error

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    val systemSettings: StateFlow<com.vexperthk.membersystem.data.SystemSettings?> = systemRepository.observeSettings()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val allowRegistration: StateFlow<Boolean> = combine(systemSettings) { (settings) ->
        settings?.allowPublicRegistration != false
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    fun setDisplayName(value: String) {
        _displayName.value = value
    }

    fun setEmail(value: String) {
        _email.value = value
    }

    fun setPassword(value: String) {
        _password.value = value
    }

    fun setError(value: String) {
        _error.value = value
    }

    fun register(onSuccess: () -> Unit) {
        if (!allowRegistration.value) {
            _error.value = "目前暫不開放註冊。"
            return
        }

        val name = _displayName.value.trim()
        val mail = _email.value.trim()
        val pass = _password.value.trim()

        if (name.isEmpty() || mail.isEmpty() || pass.isEmpty()) {
            _error.value = "請填寫所有欄位。"
            return
        }

        // Validate email format
        val emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\$".toRegex()
        if (!emailRegex.matches(mail)) {
            _error.value = "電子郵件格式不正確，必須是有效的電郵格式（例如：xxx@xxx.com）。"
            return
        }

        if (pass.length < 6) {
            _error.value = "密碼長度不足，請確保密碼至少為 6 位字元。"
            return
        }

        _isLoading.value = true
        _error.value = ""

        viewModelScope.launch {
            try {
                // 1. Fetch default status
                val settings = systemRepository.getSettings()
                val defaultStatus = settings?.defaultMemberStatus ?: "pending"

                // 2. Create in Firebase Auth and update profile
                val user = authRepository.register(mail, pass, name)

                // 3. Sync to Firestore (with 1.5 seconds delay)
                userRepository.syncRegistration(user.uid, mail, name, defaultStatus)

                onSuccess()
            } catch (e: Exception) {
                _error.value = e.localizedMessage ?: "註冊失敗，請重試。"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
