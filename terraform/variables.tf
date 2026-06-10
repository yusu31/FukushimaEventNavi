variable "aws_region" {
  description = "AWSリージョン（東京）"
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "プロジェクト名（全リソースの名前プレフィックスになる）"
  default     = "event-finder"
}

variable "my_ip" {
  description = "SSH接続を許可するIPアドレス（例: 203.0.113.1/32）。curl ifconfig.me で確認"
  sensitive   = true
}

variable "db_name" {
  description = "データベース名"
  default     = "event_finder_production"
}

variable "db_username" {
  description = "データベースのユーザー名"
  default     = "eventfinder"
}

variable "db_password" {
  description = "データベースのパスワード（terraform.tfvars に記載）"
  sensitive   = true
}
