package com.vexperthk.membersystem.ui.profile

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
import androidx.compose.material.icons.filled.Edit
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.vexperthk.membersystem.ui.components.AppButton
import com.vexperthk.membersystem.ui.components.LoadingView
import com.vexperthk.membersystem.ui.theme.Slate50
import com.vexperthk.membersystem.ui.theme.Slate100
import com.vexperthk.membersystem.ui.theme.Slate400
import com.vexperthk.membersystem.ui.theme.Slate500
import com.vexperthk.membersystem.ui.theme.Slate900
import com.vexperthk.membersystem.viewmodel.ProfileViewModel
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateBack: () -> Unit,
    onNavigateToEdit: () -> Unit,
    viewModel: ProfileViewModel = viewModel()
) {
    val isLoading by viewModel.isLoading.collectAsState()
    val email by viewModel.email.collectAsState()
    val realName by viewModel.realName.collectAsState()
    val phone by viewModel.phone.collectAsState()
    val address by viewModel.address.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("個人檔案", fontWeight = FontWeight.Bold) },
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
        if (isLoading) {
            LoadingView(modifier = Modifier.padding(paddingValues))
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
                // Profile Card Header
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
                        // Avatar placeholder
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(RoundedCornerShape(20.dp))
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(40.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = realName.orEmpty().ifBlank { "未填寫真實姓名" },
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900
                        )

                        Text(
                            text = email,
                            fontSize = 14.sp,
                            color = Slate500,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Detailed Info
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(
                            text = "基本聯絡資料",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate900,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )

                        InfoRow(
                            icon = Icons.Default.Person,
                            label = "真實姓名",
                            value = realName.orEmpty().ifBlank { "未設置" }
                        )

                        InfoRow(
                            icon = Icons.Default.Email,
                            label = "電子郵件",
                            value = email
                        )

                        // Clean HK phone display
                        val safePhone = phone.orEmpty()
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
                            value = address.orEmpty().ifBlank { "未設置" }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))

                // Edit Button
                AppButton(
                    onClick = onNavigateToEdit,
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = Color.White,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "編輯個人資料",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun InfoRow(
    icon: ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Slate100),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Slate500,
                modifier = Modifier.size(18.dp)
            )
        }

        Spacer(modifier = Modifier.width(16.dp))

        Column {
            Text(
                text = label,
                fontSize = 12.sp,
                color = Slate400,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = value,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}
