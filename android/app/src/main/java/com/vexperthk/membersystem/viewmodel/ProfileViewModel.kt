package com.vexperthk.membersystem.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.vexperthk.membersystem.data.User
import com.vexperthk.membersystem.repository.AuthRepository
import com.vexperthk.membersystem.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class ProfileViewModel(
    private val authRepository: AuthRepository = AuthRepository(),
    private val userRepository: UserRepository = UserRepository()
) : ViewModel() {

    private val auth = FirebaseAuth.getInstance()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving

    private val _success = MutableStateFlow(false)
    val success: StateFlow<Boolean> = _success

    private val _error = MutableStateFlow("")
    val error: StateFlow<String> = _error

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email

    // Form inputs
    private val _realName = MutableStateFlow("")
    val realName: StateFlow<String> = _realName

    private val _phone = MutableStateFlow("")
    val phone: StateFlow<String> = _phone

    private val _address = MutableStateFlow("")
    val address: StateFlow<String> = _address

    // Password change inputs
    private val _newPassword = MutableStateFlow("")
    val newPassword: StateFlow<String> = _newPassword

    private val _confirmPassword = MutableStateFlow("")
    val confirmPassword: StateFlow<String> = _confirmPassword

    private var initialUser: User? = null

    init {
        loadProfile()
    }

    fun setRealName(value: String) {
        _realName.value = value
    }

    fun setPhone(value: String) {
        _phone.value = value
    }

    fun setAddress(value: String) {
        _address.value = value
    }

    fun setNewPassword(value: String) {
        _newPassword.value = value
    }

    fun setConfirmPassword(value: String) {
        _confirmPassword.value = value
    }

    fun setError(value: String) {
        _error.value = value
    }

    fun setSuccess(value: Boolean) {
        _success.value = value
    }

    fun loadProfile() {
        val user = auth.currentUser
        if (user == null) {
            _isLoading.value = false
            return
        }

        _isLoading.value = true
        _error.value = ""
        _email.value = user.email ?: ""

        viewModelScope.launch {
            try {
                val userDoc = userRepository.getUser(user.uid)
                if (userDoc != null) {
                    initialUser = userDoc
                    _realName.value = userDoc.realName.orEmpty()
                    _phone.value = userDoc.phone.orEmpty()
                    _address.value = userDoc.address.orEmpty()
                } else {
                    _realName.value = user.displayName ?: ""
                }
            } catch (e: Exception) {
                _error.value = "載入個人檔案失敗"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun saveChanges(onSuccess: () -> Unit) {
        val currentUser = auth.currentUser
        if (currentUser == null) {
            _error.value = "請先登入。"
            return
        }

        _error.value = ""
        _success.value = false

        // HK Phone validation
        val rawPhone = _phone.value.trim()
        var cleanedPhone = rawPhone.replace("[\\s\\-()]".toRegex(), "")
        if (cleanedPhone.startsWith("+852")) {
            cleanedPhone = cleanedPhone.substring(4)
        } else if (cleanedPhone.startsWith("852") && cleanedPhone.length > 8) {
            cleanedPhone = cleanedPhone.substring(3)
        }

        if (cleanedPhone.isEmpty()) {
            _error.value = "請輸入聯絡電話。"
            return
        }

        if (!"^\\d{8}\$".toRegex().matches(cleanedPhone)) {
            _error.value = "電話資料格式不正確，必須是 8 位數字的香港電話（例如：21234567 或 91234567）。"
            return
        }

        _phone.value = cleanedPhone

        val currentRealName = _realName.value.trim()
        val currentAddress = _address.value.trim()

        if (currentRealName.isEmpty()) {
            _error.value = "真實姓名不得為空。"
            return
        }

        // Precise delta tracking
        val changedFields = mutableMapOf<String, Any>()
        initialUser?.let { initial ->
            if (currentRealName != initial.realName.orEmpty()) changedFields["realName"] = currentRealName
            if (cleanedPhone != initial.phone.orEmpty()) changedFields["phone"] = cleanedPhone
            if (currentAddress != initial.address.orEmpty()) changedFields["address"] = currentAddress
        } ?: run {
            changedFields["realName"] = currentRealName
            changedFields["phone"] = cleanedPhone
            changedFields["address"] = currentAddress
        }

        if (changedFields.isEmpty()) {
            _success.value = true
            onSuccess()
            return
        }

        _isSaving.value = true

        viewModelScope.launch {
            try {
                // 1. Sync Auth Profile Display Name
                val profileUpdates = com.google.firebase.auth.userProfileChangeRequest {
                    displayName = currentRealName
                }
                currentUser.updateProfile(profileUpdates).await()

                // 2. Sync to Firestore & call Functions
                userRepository.updateProfile(currentUser.uid, currentRealName, cleanedPhone, currentAddress, changedFields)

                // Update initial user cache
                initialUser = User(
                    uid = currentUser.uid,
                    email = currentUser.email ?: "",
                    displayName = currentRealName,
                    realName = currentRealName,
                    phone = cleanedPhone,
                    address = currentAddress,
                    role = initialUser?.role ?: "member",
                    status = initialUser?.status ?: "active"
                )

                _success.value = true
                onSuccess()
            } catch (e: Exception) {
                _error.value = "保存失敗，請重試。"
            } finally {
                _isSaving.value = false
            }
        }
    }

    fun changePassword(onSuccess: () -> Unit) {
        val pass = _newPassword.value
        val confirm = _confirmPassword.value

        if (pass.isEmpty() || confirm.isEmpty()) {
            _error.value = "請填寫新密碼與確認密碼。"
            return
        }

        if (pass != confirm) {
            _error.value = "兩次輸入的密碼不一致。"
            return
        }

        if (pass.length < 6) {
            _error.value = "密碼長度不足，請確保密碼至少為 6 位字元。"
            return
        }

        _isSaving.value = true
        _error.value = ""
        _success.value = false

        viewModelScope.launch {
            try {
                authRepository.updatePassword(pass)
                _success.value = true
                _newPassword.value = ""
                _confirmPassword.value = ""
                onSuccess()
            } catch (e: com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException) {
                _error.value = "基於安全性考量，此操作需要您重新登入後再試。"
            } catch (e: Exception) {
                _error.value = "密碼更新失敗，請確保密碼至少為 6 位字元。"
            } finally {
                _isSaving.value = false
            }
        }
    }

    fun forgotPassword(email: String, onSuccess: () -> Unit) {
        if (email.trim().isEmpty()) {
            _error.value = "請輸入您的電子郵件。"
            return
        }

        _isSaving.value = true
        _error.value = ""
        _success.value = false

        viewModelScope.launch {
            try {
                authRepository.sendPasswordReset(email.trim())
                _success.value = true
                onSuccess()
            } catch (e: Exception) {
                _error.value = "送出密碼重設郵件失敗，請確認電郵地址是否正確。"
            } finally {
                _isSaving.value = false
            }
        }
    }
}
