#!/usr/bin/python3
# -*- coding: utf8 -*-
"""
@File    :   config.py    
@Contact :   zhangyu@onesight.com

@Modify Time    @Author @Version    @Description
------------    ------- --------    -----------
2021/11/3       zhangyu 1.0         None
"""
import sys

# DB配置
DB_HOST = '127.0.0.1' if sys.platform.startswith('linux') else '127.0.0.1'
DB_PORT = 3306
DB_MAX_CONNECTIONS = 5
DB_MIN_CONNECTIONS = 1
DB_USER = 'root'
DB_PASSWORD = 'root'
DB_NAME = 'db'
