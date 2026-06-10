# セキュリティグループ（ファイアウォール設定）
# SSH は自分のIPのみ、HTTP は全公開（採用担当者がアクセスできるように）

# EC2用セキュリティグループ
resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-ec2-sg"
  description = "EC2 instance security group"
  vpc_id      = aws_vpc.main.id

  # SSH（デプロイ・メンテナンス用）- 自分のIPのみ
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
    description = "SSH from my IP only"
  }

  # HTTP - 全公開（採用担当者もアクセスできるように）
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  # アウトバウンド（全て許可）
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-ec2-sg"
    Project = var.project_name
  }
}

# RDS用セキュリティグループ - EC2からのみ接続を許可
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "RDS instance security group"
  vpc_id      = aws_vpc.main.id

  # MySQL（3306番）はEC2セキュリティグループからのみ許可
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
    description     = "MySQL from EC2 only"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-rds-sg"
    Project = var.project_name
  }
}
