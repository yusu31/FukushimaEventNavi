output "ec2_public_ip" {
  description = "EC2インスタンスの固定IPアドレス（Elastic IP）"
  value       = aws_eip.app.public_ip
}

output "ssh_command" {
  description = "EC2へのSSH接続コマンド"
  value       = "ssh -i terraform/app-key ec2-user@${aws_eip.app.public_ip}"
}

output "app_url" {
  description = "アプリのURL（nginx経由）"
  value       = "http://${aws_eip.app.public_ip}"
}

output "rds_endpoint" {
  description = "RDSのエンドポイント（Railsの接続先ホスト名）"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}
