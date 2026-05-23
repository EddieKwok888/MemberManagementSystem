package com.vexperthk.membersystem.ui.admin

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import com.vexperthk.membersystem.ui.components.AppButton
import com.vexperthk.membersystem.ui.components.ErrorView
import com.vexperthk.membersystem.ui.components.LoadingView
import com.vexperthk.membersystem.ui.profile.InfoRow
import com.vexperthk.membersystem.ui.theme.Slate50
import com.vexperthk.membersystem.ui.theme.Slate200
import com.vexperthk.membersystem.ui.theme.Slate500
import com.vexperthk.membersystem.ui.theme.Slate900
import com.vexperthk.membersystem.viewmodel.AdminViewModel
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminMemberDetailsScreen(
    onNavigateBack: () -> Unit,
    viewModel: AdminViewModel
) {
    val member by viewModel.selectedMember.collectAsState()
    val isSaving by viewModel.isSaving.collectAsState()
    val error by viewModel.error.collectAsState()
    val success by viewModel.success.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("會員詳細資料", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Slate900,
                    navigationIconContentColor = Slate900
                )
            )
        }
    ) { paddingValues ->
        val currentMember = member
        if (currentMember == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Slate50)
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Text("載入資料中...", color = Slate500, fontSize = 16.sp)
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Slate50)
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                ErrorView(message = error, modifier = Modifier.padding(bottom = 16.dp))

                if (success) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFECFDF5), shape = RoundedCornerShape(12.dp))
                            .padding(16.dp)
                            .padding(bottom = 16.dp)
                    ) {
                        Text(
                            text = "✨ 會員狀態已順利變更並同步至系統中！",
                            color = Color(0xFF047857),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Profile card header
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(RoundedCornerShape(16.dp))
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

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = currentMember.realName.orEmpty().ifBlank { currentMember.displayName.orEmpty().ifBlank { "未填寫姓名" } },
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )

                        Text(
                            text = currentMember.email.orEmpty(),
                            fontSize = 14.sp,
                            color = Slate500,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Detail info breakdown
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(
                            text = "聯絡與系統資料",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        InfoRow(
                            icon = Icons.Default.Email,
                            label = "電子郵件",
                            value = currentMember.email.orEmpty()
                        )

                        val safePhone = currentMember.phone.orEmpty()
                        val formattedPhone = if (safePhone.length == 8) {
                            "${safePhone.substring(0, 4)} ${safePhone.substring(4)}"
                        } else {
                            safePhone.ifBlank { "未設置" }
                        }

                        InfoRow(
                            icon = Icons.Default.Phone,
                            label = "聯絡電話",
                            value = formattedPhone
                        )

                        InfoRow(
                            icon = Icons.Default.Home,
                            label = "通訊地址",
                            value = currentMember.address.orEmpty().ifBlank { "未設置" }
                        )

                        // Registration date formatting
                        val dateText = currentMember.createdAt?.toDate()?.let { date ->
                            SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(date)
                        } ?: "未知時間"

                        InfoRow(
                            icon = Icons.Default.Info,
                            label = "註冊日期",
                            value = dateText
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Status adjustment panel
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(
                            text = "帳戶狀態變更管理",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )

                        Text(
                            text = "您可以修改該會員的使用狀態。停用帳戶將立即登出並拒絕其登入系統，待審核狀態會限制該帳戶的特定前台功能。",
                            fontSize = 12.sp,
                            color = Slate500,
                            modifier = Modifier.padding(bottom = 20.dp)
                        )

                        if (isSaving) {
                            LoadingView(modifier = Modifier.height(60.dp))
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Pending Toggle
                                AppButton(
                                    onClick = { viewModel.updateMemberStatus(currentMember.uid.orEmpty(), "pending") },
                                    containerColor = if (currentMember.status == "pending") Color(0xFFFFFBEB) else Slate50,
                                    contentColor = if (currentMember.status == "pending") Color(0xFFD97706) else Slate500,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("🟡 待審核", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }

                                // Active Toggle
                                AppButton(
                                    onClick = { viewModel.updateMemberStatus(currentMember.uid.orEmpty(), "active") },
                                    containerColor = if (currentMember.status == "active") Color(0xFFECFDF5) else Slate50,
                                    contentColor = if (currentMember.status == "active") Color(0xFF047857) else Slate500,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("🟢 啟用", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }

                                // Disabled Toggle
                                AppButton(
                                    onClick = { viewModel.updateMemberStatus(currentMember.uid.orEmpty(), "disabled") },
                                    containerColor = if (currentMember.status == "disabled") Color(0xFFFEF2F2) else Slate50,
                                    contentColor = if (currentMember.status == "disabled") Color(0xFFDC2626) else Slate500,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("🔴 停用", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
