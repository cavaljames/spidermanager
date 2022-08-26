"""
@File    :   msqutil.py
@Contact :   zhangyu@onesight.com

@Modify Time    @Author @Version    @Description
------------    ------- --------    -----------
2021/9/6        zhangyu 1.0         mysql工具类
"""

from .dbconn import DBConn


###################
#      生成sql    #
###################
# 根据sql_dict拼接sql
def get_query_sql_by_dict(sql_dict: dict):
    """
        kwargs格式，例：
        {
            'query_cols': ['id', 'name'],
            'table_name': 'ttt',
            'where': {
                'task_status': TASK_STATUS_READY,
                'task_type': 'Page',
                'task_id': '1bf551e4-4345-4e51-9828-5ff949a95887'
            },
            'limit': 10,
            'order': {
                'col': 'name',
                'rule': -1
            }
        }
    """
    # 原始SQL
    org_sql = 'SELECT {query_cols} FROM {table_name} %s'
    # 查询字段
    qc = ''
    if 'query_cols' in sql_dict:
        qc = sql_dict['query_cols']
        if isinstance(qc, list):
            qc = ','.join(qc)
    else:
        qc = '*'
    # 查询表名
    tn = ''
    if 'table_name' in sql_dict:
        tn = sql_dict['table_name']
    org_sql = org_sql.format(query_cols=qc, table_name=tn)
    # WHERE条件
    where_clause = ''
    if 'where' in sql_dict and len(sql_dict['where']) > 0:
        where_clause += 'WHERE ' + ' AND '.join(
            [(k + '=' + str(v if isinstance(v, int) else '"' + v + '"')) for k, v in sql_dict['where'].items()]
        )
    exec_sql = org_sql % where_clause
    # ORDER BY条件
    if 'order' in sql_dict:
        print()
        exec_sql += ' ORDER BY %s ' % (
                sql_dict['order']['col'] + (' ASC' if sql_dict['order']['rule'] > 0 else ' DESC')
        )
    # LIMIT条件
    if 'limit' in sql_dict:
        exec_sql += ' LIMIT %s ' % sql_dict['limit']
    return exec_sql


# 处理sql中k=v的字段拼接
def handle_kv(kv):
    if isinstance(kv[1], str):
        return kv[0] + '=\'' + kv[1] + '\''
    return kv[0] + '=' + str(kv[1])


# 获取插入mysql的sql
def get_insert_sql(table_name: str, db_dict: dict):
    marks = ', '.join(['%s'] * len(db_dict))

    def sql_value(v): return '\'' + str(v) + '\''

    values = ', '.join(map(sql_value, db_dict.values()))
    columns = ', '.join(db_dict.keys())
    sql = f"INSERT INTO {table_name} ({columns}) VALUES ({marks});"
    rt_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({values});"
    return sql, rt_sql


# 获取更新数据sql
def get_update_sql(table_name, set_clause, where_clause):
    # 更新task数据
    set_str = ', '.join(map(handle_kv, set_clause))
    where_str = ' AND '.join(map(handle_kv, where_clause))
    sql = f"UPDATE {table_name} SET {set_str} WHERE {where_str}"
    return sql


###################
#      查询操作    #
###################
# select获取数据
def select_data_in_conn(db_obj: DBConn, sql: str, one=False):
    with db_obj as conn, conn.cursor() as cur:
        cur.execute(sql)
        if one:
            return cur.fetchone()
        else:
            return cur.fetchall()


###################
#      插入操作    #
###################
# 插入mysql数据
def insert_dict(table_name: str, db_dict: dict):
    marks = ', '.join(['%s'] * len(db_dict))

    def sql_value(v): return '\'' + str(v) + '\''

    values = ', '.join(map(sql_value, db_dict.values()))
    columns = ', '.join(db_dict.keys())
    sql = f"INSERT INTO {table_name} ({columns}) VALUES ({marks});"
    rt_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({values});"
    with DBConn() as conn:
        cur = conn.cursor()
        cur.execute(sql, list(db_dict.values()))
        conn.commit()
    return rt_sql


# 插入数据
def insert_sql(db_obj: DBConn, sql, db_dict):
    with db_obj as conn, conn.cursor() as cur:
        cur.execute(sql, list(db_dict.values()))
        last_id = cur.lastrowid
    return last_id


# 批量插入数据
def insert_sql_many(db_obj: DBConn, table_name, dt_class_list):
    """
    插入data_class到表中
    :param db_obj: mysql连接
    :param table_name: 要插入的表名
    :param dt_class_list: 要插入的数据
    """
    if len(dt_class_list) > 0:
        example_data = dt_class_list[0]
    else:
        print('要插入的数据列表为空！！！')
        return
    key_sql = ','.join(example_data.keys())
    value_sql = ','.join(['%s'] * len(example_data.values()))
    ist_sql = 'insert into %s (%s) values (%s)' % (table_name, key_sql, value_sql)

    def get_values(x):
        return tuple(x.values())

    values = map(get_values, dt_class_list)

    # 提交数据库操作
    with db_obj as conn, conn.cursor() as cur:
        try:
            cur.executemany(ist_sql, values)
        except Exception as ex:
            print(ex)
            conn.rollback()
    return ist_sql


# 保存Dataframe数据到mysql
def save_dataframe(db_obj: DBConn, table_name, dataframe):
    # 使用pandas过程中，数据转化成DataFrame格式会将缺失值会用NAN填充, 如果直接将数据用pymysql写入数据库会报错！
    # 此时需要将NAN替换成None , 因为None插入数据库会被填写Null  也就是数据库中的空值

    # 存储列名
    keys = dataframe.keys()
    values = dataframe.values.tolist()

    key_sql = ','.join(keys)
    value_sql = ','.join(['%s'] * dataframe.shape[1])

    ist_sql = 'insert into %s (%s) values (%s)' % (table_name, key_sql, value_sql)
    # 当数据库中有重复主键值的时候变为更新操作
    # ist_sql = 'insert into %s (%s) values (%s) on duplicate key update' % (table_name, key_sql, value_sql)
    # update_str = ','.join([" {key} = values({key})".format(key=key) for key in keys])
    # insert_sql += update_str

    # 提交数据库操作
    with db_obj as conn, conn.cursor() as cur:
        try:
            cur.executemany(ist_sql, values)
        except Exception as e:
            print(e)
            conn.rollback()


# 查询并插入数据
def select_and_save(db_obj: DBConn, insert_tname, select_tname, insert_cols, select_cols, where=None):
    """
    查询并插入到新的表中
    :param db_obj: mysql连接
    :param insert_tname: 要插入的表名
    :param select_tname: 要查询的表名
    :param insert_cols: 要插入对应的字段
    :param select_cols: 要查询对应的字段
    :param where: 添加where条件
    :return: sql
    """
    ins_cols = ','.join(insert_cols)
    sel_cols = ','.join(select_cols)
    sql = f'INSERT INTO {insert_tname}({ins_cols}) SELECT {sel_cols} FROM {select_tname}'
    if where:
        sql += f' WHERE {where}'
    with db_obj as conn, conn.cursor() as cur:
        try:
            cur.execute(sql)
        except Exception as e:
            print(e)
            conn.rollback()
        return sql


# 插入data_class到表中
def save_dataclass(db_obj: DBConn, table_name, dt_class_list):
    """
    插入data_class到表中
    :param db_obj: mysql连接
    :param table_name: 要插入的表名
    :param dt_class_list: 要插入的数据
    """
    if len(dt_class_list) > 0:
        example_data = dt_class_list[0]
    else:
        print('要插入的数据列表为空！！！')
        return
    key_sql = ','.join(example_data.__dict__.keys())
    value_sql = ','.join(['%s'] * len(example_data.__dict__.values()))
    ist_sql = 'insert into %s (%s) values (%s)' % (table_name, key_sql, value_sql)

    def get_values(x):
        return tuple(x.__dict__.values())

    values = map(get_values, dt_class_list)

    # 提交数据库操作
    with db_obj as conn, conn.cursor() as cur:
        try:
            cur.executemany(ist_sql, values)
        except Exception as ex:
            print(ex)
            conn.rollback()


###################
#      更新操作    #
###################
# 更新task数据
def update_table(table_name, set_clause, where_clause):
    set_str = ', '.join(map(handle_kv, set_clause))
    where_str = ' AND '.join(map(handle_kv, where_clause))
    sql = f"UPDATE {table_name} SET {set_str} WHERE {where_str}"
    with DBConn() as conn:
        cur = conn.cursor()
        cur.execute(sql)
        conn.commit()
    return sql


# 更新task数据
def update_conn_table(db_obj: DBConn, table_name, set_clause, where_clause):
    with db_obj as conn, conn.cursor() as cur:
        set_str = ', '.join(map(handle_kv, set_clause))
        where_str = ' AND '.join(map(handle_kv, where_clause))
        sql = f"UPDATE {table_name} SET {set_str} WHERE {where_str}"
        cur.execute(sql)
    return sql


# 删除数据
def delete_by_id(table_name, did):
    with DBConn() as conn:
        cur = conn.cursor()
        cur.execute(f'DELETE FROM {table_name} WHERE id={str(did)}')

