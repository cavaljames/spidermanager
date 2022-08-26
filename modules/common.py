#!/usr/bin/python3
# -*- coding: utf8 -*-
"""
@File    :   common.py    
@Contact :   zhangyu@onesight.com

@Modify Time    @Author @Version    @Description
------------    ------- --------    -----------
2021/11/22      zhangyu 1.0         功能类
"""
import ast
import datetime

from .dbconn import DBConn
from . import msqutil
from functools import reduce


def get_tasks(root_id, task_type, disable, task_status, order, job_id):
    fetch_data = None
    sql_dict = {
        'query_cols': ['*', 'ctps.page_username as page_username', 'ctps.page_name as page_name_zh', 'ctps.page_link as page_link',
                       'CONVERT_TZ(task_create_time,\'+00:00\',\'+8:00\') as ct', 'CONVERT_TZ(ct.update_time,\'+00:00\',\'+8:00\') as ut'],
        'table_name': 'crawl_task ct left join crawl_task_page_stats ctps on ct.root_id=ctps.page_id',
        'where': {
            'task_type': task_type,
            'task_status': task_status,
            'root_id': root_id,
            'job_id': job_id,
            'disable': disable

        },
        'order': {
            'col': f'ct.{order}',
            'rule': 1 if 'step' == order else -1
        }
    }
    if task_type == 'All':
        del sql_dict['where']['task_type']
    if task_status == 'ALL':
        del sql_dict['where']['task_status']
    if disable == 'ALL':
        del sql_dict['where']['disable']
    if not root_id:
        del sql_dict['where']['root_id']
    if not job_id:
        del sql_dict['where']['job_id']
    with DBConn() as con, con.cursor() as cur:
        sql = msqutil.get_query_sql_by_dict(sql_dict)
        try:
            cur.execute(sql)
            fetch_data = cur.fetchall()
        except Exception as e:
            print(e)
            con.rollback()

    # 处理帖子获取天数
    handle_post_time_start(fetch_data)
    return sql, fetch_data


def get_stats(order, order_rule, group=None):
    fetch_data = None
    sql_dict = {
        'query_cols': ['*', 'CONVERT_TZ(create_time,\'+00:00\',\'+8:00\') as ct', 'CONVERT_TZ(update_time,\'+00:00\',\'+8:00\') as ut'],
        'table_name': 'crawl_task_page_stats',
        'order': {
            'col': order,
            'rule': order_rule
        }
    }
    if group:
        where_clause = {'group_name': group}
        sql_dict['where'] = where_clause
    with DBConn() as con, con.cursor() as cur:
        sql = msqutil.get_query_sql_by_dict(sql_dict)
        try:
            cur.execute(sql)
            fetch_data = cur.fetchall()
        except Exception as e:
            print(e)
            con.rollback()
    return sql, fetch_data


def get_total(tasks):
    total = reduce(sum_dict, tasks)
    total['now_time'] = datetime.datetime.strftime(datetime.datetime.now() + datetime.timedelta(hours=8), '%Y-%m-%d %H:%M:%S')
    return total


def sum_dict(a, b):
    temp = dict()
    for k in a.keys() | b.keys():
        if k in ['post_count', 'comment_count', 'like_count', 'share_count', 'fans_count']:
            temp[k] = sum(d.get(k, 0) for d in (a, b))
    return temp


# 处理帖子获取天数
def handle_post_time_start(dts):
    for dt in dts:
        if 'Post' == dt['task_type']:
            params = dt['params']
            p = ast.literal_eval(params)
            if 'time_start' in p:
                dt['time_start'] = p['time_start']
            else:
                dt['time_start'] = 30


