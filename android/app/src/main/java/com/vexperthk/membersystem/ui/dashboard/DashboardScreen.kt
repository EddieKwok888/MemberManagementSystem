package com.vexperthk.membersystem.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexperthk.membersystem.ui.components.AppButton
import com.vexperthk.membersystem.ui.theme.Slate50
import com.vexperthk.membersystem.ui.theme.Slate100
import com.vexperthk.membersystem.ui.theme.Slate200
import com.vexperthk.membersystem.ui.theme.Slate400
import com.vexperthk.membersystem.ui.theme.Slate500
import com.vexperthk.membersystem.ui.theme.Slate700
import com.vexperthk.membersystem.ui.theme.Slate900
import com.vexperthk.membersystem.viewmodel.AuthViewModel

@Composable
fun DashboardScreen(
    onNavigateToProfile: () -> Unit,
    onNavigateToEditProfile: () -> Unit,
    onNavigateToChangePassword: () -> Unit,
    viewModel: AuthViewModel
) {
    val userDoc by viewModel.userDoc.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    val name = userDoc?.realName?.takeIf { it.isNotEmpty() }
        ?: userDoc?.displayName?.takeIf { it.isNotEmpty() }
        ?: currentUser?.displayName?.takeIf { it.isNotEmpty() }
        ?: "會員"

    val email = userDoc?.email?.takeIf { it.isNotEmpty() }
        ?: currentUser?.email
        ?: ""

    val role = userDoc?.role ?: "member"
    val status = userDoc?.status ?: "active"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate50)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Premium Profile Greeting Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = "您好, $name 👋",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = Slate900
                    )
                    Text(
                        text = email,
                        fontSize = 14.sp,
                        color = Slate500
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Badges Row (Role & Status)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Role Badge
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (role == "admin") Color(0xFFF3E8FF) else Color(0xFFEFF6FF)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.Start
                    ) {
                        Text(text = "帳戶權限", fontSize = 12.sp, color = Slate500, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (role == "admin") "👑 系統管理員" else "👤 一般會員",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (role == "admin") Color(0xFF7E22CE) else Color(0xFF1D4ED8)
                        )
                    }
                }

                // Status Badge
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = when (status) {
                            "active" -> Color(0xFFECFDF5)
                            "pending" -> Color(0xFFFFFBEB)
                            else -> Color(0xFFFEF2F2)
                        }
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.Start
                    ) {
                        Text(text = "帳戶狀態", fontSize = 12.sp, color = Slate500, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = when (status) {
                                "active" -> "🟢 使用中"
                                "pending" -> "🟡 審核中"
                                "disabled" -> "🔴 已停用"
                                else -> status.uppercase()
                            },
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (status) {
                                "active" -> Color(0xFF047857)
                                "pending" -> Color(0xFFD97706)
                                else -> Color(0xFFB91C1C)
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "帳戶選單",
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Slate700,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp)
            )

            // Navigation Options
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    DashboardMenuItem(
                        icon = Icons.Default.Person,
                        title = "個人檔案詳情",
                        subtitle = "查看您的電話、地址與註冊資料",
                        onClick = onNavigateToProfile
                    )
                    DashboardMenuDivider()
                    DashboardMenuItem(
                        icon = Icons.Default.Settings,
                        title = "編輯個人資料",
                        subtitle = "更新您的姓名、電話與通訊地址",
                        onClick = onNavigateToEditProfile
                    )
                    DashboardMenuDivider()
                    DashboardMenuItem(
                        icon = Icons.Default.Lock,
                        title = "安全與密碼修改",
                        subtitle = "更新您的帳戶登入密碼",
                        onClick = onNavigateToChangePassword
                    )
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            // Logout Action Button
            AppButton(
                onClick = { viewModel.logout() },
                containerColor = Color(0xFFFEF2F2),
                contentColor = Color(0xFFDC2626),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ExitToApp,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "登出帳戶",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun DashboardMenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 18.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Slate100),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Slate700,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = Slate500,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        Icon(
            imageVector = Icons.Default.ArrowForward,
            contentDescription = null,
            tint = Slate400,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
fun DashboardMenuDivider() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(Slate200)
            .padding(horizontal = 20.dp)
    )
}
