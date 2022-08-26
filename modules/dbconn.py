#!/usr/bin/python3
# -*- coding: utf8 -*-
"""
@File    :   tidb_conn.py    
@Contact :   zhangyu@onesight.com

@Modify Time    @Author @Version    @Description
------------    ------- --------    -----------
2021/10/25      zhangyu 1.0         数据库连接池
"""

from pymysql.cursors import DictCursor
from pymysql.err import MySQLError
from structlog import get_logger
import pymysql
import atexit
from . import config

try:
    from DBUtils.PooledDB import PooledDB
except ImportError:
    from dbutils.pooled_db import PooledDB

logger = get_logger()
old_connection_pool = None


# 旧版 数据库连接类
class DBConn:
    def __init__(self):
        if old_connection_pool is None:
            init_old_db_pool(config.DB_MAX_CONNECTIONS, config.DB_MIN_CONNECTIONS)
        if old_connection_pool is None:
            raise ValueError(
                "Old Database connection has not been initialized."
            )
        self.conn = old_connection_pool.connection()

    def __enter__(self):
        return self.conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        st = True
        try:
            if not exc_type:
                self.conn.commit()
            else:
                # There was an exception in the DBConn body
                if isinstance(exc_type, MySQLError):
                    logger.warning(f"{exc_val}")
                # 返回 False 会将相关异常传递出去.
                st = False
                self.conn.rollback()
        except Exception as e:
            self.conn.rollback()
            logger.exception(
                "Exception cleaning a connection before closing it or returning it to the pool.",
                exc_info=e,
            )
        finally:
            self.conn.close()
            self.conn = None
            return st


def init_old_db_pool(max_connections, min_connections):
    """
    初始化一个 Worker(职称) 级别的连接池
    :param max_connections: 最大连接数
    :param min_connections: 最小连接数
    :return:
    """
    global old_connection_pool

    if old_connection_pool is None:
        logger.info(
            f"Initialize database connection pool for db name: { config.DB_NAME} host: { config.DB_HOST}"
        )
        try:
            old_connection_pool = PooledDB(
                pymysql,
                maxconnections=max_connections,
                mincached=min_connections,
                host=config.DB_HOST,
                port=config.DB_PORT,
                user=config.DB_USER,
                passwd=config.DB_PASSWORD,
                charset="utf8mb4",
                db=config.DB_NAME,
                cursorclass=DictCursor,
            )
        except Exception as e:
            logger.exception(
                f"Exception in initializing old database connection pool. errors: {e}"
            )
            raise Exception("Exception in initializing old database connection pool") from e
    else:
        logger.info(f"Old Database connection pool has been initialized.")


@atexit.register
def close_old_db_pool():
    """
    关闭连接池, 并设置 变量 为 None。
    :return:
    """
    global old_connection_pool
    if old_connection_pool is not None:
        logger.info("Close the old database connection pool.")
        old_connection_pool.close()
        old_connection_pool = None
