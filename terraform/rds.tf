# RDS MySQL 8.0
# マネージド型データベース。OS管理・バックアップはAWSが担当。
# db.t3.micro = 無料枠対象（750時間/月・12ヶ月）

# DBサブネットグループ - RDSを配置するサブネットの集合
# AWSの仕様で2つの異なるAZにまたがるサブネットが必要
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name    = "${var.project_name}-db-subnet-group"
    Project = var.project_name
  }
}

# RDSインスタンス本体
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # ストレージ（20GB = 無料枠の上限）
  allocated_storage = 20
  storage_type      = "gp2"

  # データベース設定
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # ネットワーク設定 - EC2からのみアクセス可
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false

  # 無料枠・学習用設定
  multi_az            = false
  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name    = "${var.project_name}-db"
    Project = var.project_name
  }
}
