package com.vexperthk.membersystem.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.vexperthk.membersystem.data.User
import com.vexperthk.membersystem.repository.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AdminViewModel(
    private val userRepository: UserRepository = UserRepository()
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    private val _selectedMember = MutableStateFlow<User?>(null)
    val selectedMember: StateFlow<User?> = _selectedMember

    private val _isSaving = MutableStateFlow(false)
    val isSaving: StateFlow<Boolean> = _isSaving

    private val _error = MutableStateFlow("")
    val error: StateFlow<String> = _error

    private val _success = MutableStateFlow(false)
    val success: StateFlow<Boolean> = _success

    private val _allUsers = MutableStateFlow<List<User>>(emptyList())

    init {
        observeUsers()
    }

    private fun observeUsers() {
        viewModelScope.launch {
            try {
                userRepository.observeAllUsers().collect { list ->
                    _allUsers.value = list
                    _error.value = ""
                }
            } catch (e: Exception) {
                // Graceful security mapping if Firestore permission denied occurs
                if (e.message?.contains("PERMISSION_DENIED", ignoreCase = true) == true) {
                    _error.value = "讀取會員清單失敗：權限不足（Permission Denied）。"
                } else {
                    _error.value = "讀取會員清單失敗，請重試。"
                }
            }
        }
    }

    val filteredUsers: StateFlow<List<User>> = combine(_allUsers, _searchQuery) { users, query ->
        if (query.isBlank()) {
            users
        } else {
            val q = query.trim().lowercase()
            users.filter { user ->
                val realName = user.realName.orEmpty().lowercase()
                val displayName = user.displayName.orEmpty().lowercase()
                val email = user.email.orEmpty().lowercase()
                realName.contains(q) || displayName.contains(q) || email.contains(q)
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Calculations/Stats Pipeline
    val memberCountStats: StateFlow<MemberStats> = _allUsers.map { users ->
        val total = users.size
        val active = users.count { it.status == "active" }
        val pending = users.count { it.status == "pending" }
        val disabled = users.count { it.status == "disabled" }
        MemberStats(total, active, pending, disabled)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), MemberStats())

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun selectMember(member: User?) {
        _selectedMember.value = member
        _error.value = ""
        _success.value = false
    }

    fun updateMemberStatus(uid: String, newStatus: String) {
        if (uid.isBlank()) return
        _isSaving.value = true
        _error.value = ""
        _success.value = false

        viewModelScope.launch {
            try {
                userRepository.updateMemberStatus(uid, newStatus)
                _success.value = true
                // Update selected member locally to sync sheet UI
                _selectedMember.value?.let { current ->
                    if (current.uid == uid) {
                        _selectedMember.value = current.copy(status = newStatus)
                    }
                }
            } catch (e: Exception) {
                if (e.message?.contains("PERMISSION_DENIED", ignoreCase = true) == true) {
                    _error.value = "操作失敗：您沒有修改該會員狀態的權限。"
                } else {
                    _error.value = "更新會員狀態失敗，請重試。"
                }
            } finally {
                _isSaving.value = false
            }
        }
    }
}

data class MemberStats(
    val total: Int = 0,
    val active: Int = 0,
    val pending: Int = 0,
    val disabled: Int = 0
)
