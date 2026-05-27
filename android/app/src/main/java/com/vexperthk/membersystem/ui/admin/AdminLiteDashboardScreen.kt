package com.vexperthk.membersystem.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexperthk.membersystem.data.User
import com.vexperthk.membersystem.ui.components.AppTextField
import com.vexperthk.membersystem.ui.components.ErrorView
import com.vexperthk.membersystem.ui.theme.Slate50
import com.vexperthk.membersystem.ui.theme.Slate100
import com.vexperthk.membersystem.ui.theme.Slate200
import com.vexperthk.membersystem.ui.theme.Slate400
import com.vexperthk.membersystem.ui.theme.Slate500
import com.vexperthk.membersystem.ui.theme.Slate700
import com.vexperthk.membersystem.ui.theme.Slate900
import com.vexperthk.membersystem.viewmodel.AdminViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminLiteDashboardScreen(
    onNavigateToDetails: () -> Unit,
    onLogout: () -> Unit,
    viewModel: AdminViewModel
) {
    val searchQuery by viewModel.searchQuery.collectAsState()
    val filteredUsers by viewModel.filteredUsers.collectAsState()
    val stats by viewModel.memberCountStats.collectAsState()
    val error by viewModel.error.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("系統管理後台 (Lite)", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Default.ExitToApp,
                            contentDescription = "登出",
                            tint = Color(0xFFDC2626)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Slate900
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate50)
                .padding(paddingValues)
        ) {
            ErrorView(message = error, modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp))

            // Search Bar Component
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 24.dp, vertical = 12.dp)
            ) {
                AppTextField(
                    value = searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    label = "搜尋會員",
                    placeholder = "請輸入姓名或電子郵件...",
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = Slate400)
                    }
                )
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Summary grid panel
                item {
                    Text(
                        text = "會員統計數據",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate700,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Total Members Card
                        StatsMiniCard(
                            label = "總註冊會員",
                            value = stats.total.toString(),
                            containerColor = Color(0xFFEFF6FF),
                            textColor = Color(0xFF1D4ED8),
                            modifier = Modifier.weight(1f)
                        )
                        // Active Members Card
                        StatsMiniCard(
                            label = "啟用中帳戶",
                            value = stats.active.toString(),
                            containerColor = Color(0xFFECFDF5),
                            textColor = Color(0xFF047857),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Pending Card
                        StatsMiniCard(
                            label = "待審核名單",
                            value = stats.pending.toString(),
                            containerColor = Color(0xFFFFFBEB),
                            textColor = Color(0xFFD97706),
                            modifier = Modifier.weight(1f)
                        )
                        // Disabled Card
                        StatsMiniCard(
                            label = "已停用帳戶",
                            value = stats.disabled.toString(),
                            containerColor = Color(0xFFFEF2F2),
                            textColor = Color(0xFFB91C1C),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = Slate200)
                }

                // Member header
                item {
                    Text(
                        text = "會員管理清單 (${filteredUsers.size} 人)",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate700,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )
                }

                if (filteredUsers.isEmpty()) {
                    item {
                        Card(
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(32.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "沒有找到任何匹配的會員資料",
                                    fontSize = 14.sp,
                                    color = Slate400,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                } else {
                    items(filteredUsers) { user ->
                        MemberItemCard(
                            user = user,
                            onClick = {
                                viewModel.selectMember(user)
                                onNavigateToDetails()
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatsMiniCard(
    label: String,
    value: String,
    containerColor: Color,
    textColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Text(text = label, fontSize = 11.sp, color = Slate500, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = textColor
            )
        }
    }
}

@Composable
fun MemberItemCard(
    user: User,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Role avatar dot
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(
                        if (user.role == "admin") Color(0xFFF3E8FF) else Color(0xFFEFF6FF)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (user.role == "admin") "👑" else "👤",
                    fontSize = 18.sp
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = user.realName.orEmpty().ifBlank { user.displayName.orEmpty().ifBlank { "未填寫姓名" } },
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    // Admin Indicator Badge
                    if (user.role == "admin") {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFE9D5FF))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text("ADMIN", fontSize = 8.sp, color = Color(0xFF7E22CE), fontWeight = FontWeight.ExtraBold)
                        }
                    }
                }

                Text(
                    text = user.email.orEmpty(),
                    fontSize = 12.sp,
                    color = Slate500,
                    modifier = Modifier.padding(top = 2.dp)
                )

                // Render State Badge
                Spacer(modifier = Modifier.height(8.dp))
                Row {
                    val statusText = when (user.status) {
                        "active" -> "🟢 使用中"
                        "pending" -> "🟡 待審核"
                        "disabled" -> "🔴 已停用"
                        else -> user.status.orEmpty().uppercase()
                    }
                    val statusColor = when (user.status) {
                        "active" -> Color(0xFF047857)
                        "pending" -> Color(0xFFD97706)
                        else -> Color(0xFFB91C1C)
                    }
                    val statusBg = when (user.status) {
                        "active" -> Color(0xFFECFDF5)
                        "pending" -> Color(0xFFFFFBEB)
                        else -> Color(0xFFFEF2F2)
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(statusBg)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = statusText,
                            fontSize = 10.sp,
                            color = statusColor,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = null,
                tint = Slate400,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
