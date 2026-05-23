package com.vexperthk.membersystem.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vexperthk.membersystem.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class LoginViewModel(
    private val authRepository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password

    private val _error = MutableStateFlow("")
    val error: StateFlow<String> = _error

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun setEmail(value: String) {
        _email.value = value
    }

    fun setPassword(value: String) {
        _password.value = value
    }

    fun setError(value: String) {
        _error.value = value
    }

    fun login(onSuccess: () -> Unit) {
        val currentEmail = _email.value.trim()
        val currentPassword = _password.value.trim()

        if (currentEmail.isEmpty() || currentPassword.isEmpty()) {
            _error.value = "請輸入電子郵件和密碼。"
            return
        }

        _isLoading.value = true
        _error.value = ""

        viewModelScope.launch {
            try {
                authRepository.login(currentEmail, currentPassword)
                onSuccess()
            } catch (e: Exception) {
                _error.value = "登入失敗，請檢查電郵和密碼是否正確。"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun quickLogin(testEmail: String, testPass: String, onSuccess: () -> Unit) {
        _email.value = testEmail
        _password.value = testPass
        login(onSuccess)
    }
}
