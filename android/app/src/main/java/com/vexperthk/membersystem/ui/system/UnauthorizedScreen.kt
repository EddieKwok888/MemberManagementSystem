package com.vexperthk.membersystem.ui.system

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
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vexperthk.membersystem.ui.components.AppButton
import com.vexperthk.membersystem.ui.theme.Slate50
import com.vexperthk.membersystem.ui.theme.Slate500
import com.vexperthk.membersystem.ui.theme.Slate900

@Composable
fun UnauthorizedScreen(
    status: String,
    onLogout: () -> Unit
) {
    val isPending = status == "pending"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate50),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Elegant status icon box
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(24.dp))
                    .background(if (isPending) Color(0xFFFEF3C7) else Color(0xFFFEE2E2))
                    .padding(24.dp)
            ) {
                Icon(
                    imageVector = if (isPending) Icons.Default.Info else Icons.Default.Warning,
                    contentDescription = null,
                    tint = if (isPending) Color(0xFFD97706) else Color(0xFFDC2626),
                    modifier = Modifier.size(48.dp)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = if (isPending) "帳戶審核中" else "帳戶已被停用",
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = Slate900,
                textAlign = TextAlign.Center
            )

            Text(
                text = if (isPending) {
                    "您的帳戶目前正在等待系統管理員審核。這通常需要一些時間，審核完成後您將能正常登入系統。"
                } else {
                    "基於安全防護或帳戶使用條款，您的帳戶目前已遭系統停用。如果您認為這是個錯誤，請聯絡系統管理人員以協助處理。"
                },
                fontSize = 15.sp,
                color = Slate500,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(top = 12.dp)
            )

            Spacer(modifier = Modifier.height(36.dp))

            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    AppButton(
                        onClick = onLogout,
                        containerColor = if (isPending) Slate50 else Color(0xFFFEF2F2),
                        contentColor = if (isPending) Slate900 else Color(0xFFDC2626),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ExitToApp,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("登出帳戶", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
