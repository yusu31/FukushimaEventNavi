# EC2インスタンス
# フロントエンドとバックエンドを同一サーバーで動かす。
# t2.micro = 無料枠対象（750時間/月・12ヶ月）

# 最新のAmazon Linux 2023 AMIを動的に取得
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# SSHキーペア - ローカルで生成した公開鍵をAWSに登録する
# 事前に実行: ssh-keygen -t rsa -b 4096 -f terraform/app-key
resource "aws_key_pair" "app" {
  key_name   = "${var.project_name}-key"
  public_key = file("${path.module}/app-key.pub")

  tags = {
    Name    = "${var.project_name}-key"
    Project = var.project_name
  }
}

# EC2インスタンス本体
resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t2.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  key_name               = aws_key_pair.app.key_name

  # 起動時にアプリ実行環境をインストールするスクリプト
  user_data = <<-EOF
    #!/bin/bash
    dnf update -y

    # --- バックエンド用: Ruby 3.2 + ビルド依存ライブラリ ---
    dnf install -y ruby ruby-devel rubygems gcc gcc-c++ make openssl-devel readline-devel zlib-devel

    # mysql2 gem のビルドに必要なMySQLクライアントライブラリ
    dnf install -y mysql-devel

    # Bundler（Railsの依存gem管理ツール）
    gem install bundler --no-document

    # --- フロントエンド用: Node.js 20 ---
    dnf install -y nodejs npm

    # --- 共通: Git + Nginx ---
    dnf install -y git nginx

    # Nginxを起動・自動起動設定
    systemctl enable nginx
    systemctl start nginx

    # アプリ配置用ディレクトリ
    mkdir -p /var/www/event-finder
    chown ec2-user:ec2-user /var/www/event-finder
  EOF

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name    = "${var.project_name}-app-server"
    Project = var.project_name
  }
}

# Elastic IP - EC2を再起動してもIPが変わらないようにする
# 起動中のインスタンスに紐付けている間は無料
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}
