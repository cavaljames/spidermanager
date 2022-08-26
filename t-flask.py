from flask import Flask, render_template, request
from modules import common
from datetime import timedelta

app = Flask(__name__)
app._static_folder = "./static"
app.config['DEBUG'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(seconds=1)


@app.template_filter('str_to_obj')
def str_to_obj(s, key):
    return eval(s).get(key, '')


@app.template_filter('cut_date')
def cut_date(s):
    return s.split(' ')[0]


@app.route('/tasks')
def index():
    t = request.args.get('type')
    s = request.args.get('status')
    d = request.args.get('disable')
    o = request.args.get('order')
    search = request.args.get('search')
    job = request.args.get('job')
    t = t if t else 'Page'
    s = s if s else 'READY'
    d = d if d else 'ALL'
    o = o if o else 'step'
    sql, tasks = common.get_tasks(task_type=t, task_status=s, disable=d, order=o, root_id=search, job_id=job)
    print('======== sql ========')
    print(sql)
    return render_template('tasks.html', tasks=tasks, task_type=t, task_status=s, disable=d, order=o)


@app.route('/tasks/stats')
def stats():
    o = request.args.get('order')
    o_r = request.args.get('order_rule')
    g = request.args.get('group')
    o = o if o else 'fans_count'
    o_r = int(o_r) if o_r else -1
    sql, tasks = common.get_stats(order=o, order_rule=o_r, group=g)
    total = common.get_total(tasks)
    print(total)
    print('======== sql ========')
    print(sql)
    return render_template('stats.html', tasks=tasks, total=total)


if __name__ == '__main__':
    h = '0.0.0.0'
    app.run(host=h, port=8888)

