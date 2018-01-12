/**
 * A Padavan Client
 * @c7i
 * https://github.com/c7i/padavan-client-jsbox
 */

$ui.render({
  props: {
    title: "Padavan"
  },
  views: [{
      type: "view",
      layout: function(make, view) {
        make.top.equalTo(0)
        make.width.equalTo(view.super.width)
        make.height.equalTo(180)
      },
      views: [{
        type: "text",
        props: {
          id: "system_status",
          editable: false,
          selectable: false,
          text: "",
          bgcolor: $color("#eeeeee"),
        },
        layout: $layout.fill
      }]
    },
    {
      type: "view",
      layout: function(make, view) {
        make.top.equalTo(180)
        make.width.equalTo(view.super.width)
        make.bottom.equalTo(0)
      },
      views: [{
          type: "list",
          props: {
            id: "devices",
            rowHeight: 64.0,
            separatorInset: $insets(0, 5, 0, 0),
            template: [{
              type: "label",
              props: {
                id: "name",
                font: $font("bold", 16),
                lines: 0
              },
              layout: function(make) {
                make.left.equalTo(0).offset(10)
                make.top.bottom.equalTo(0)
                make.right.inset(10)
              }
            }],
            actions: [{
              title: "WOL",
              handler: function(sender, indexPath) {
                var device = sender.object(indexPath)
                $console.info(device)
                wol(device.mac.text)
              }
            }]
          },
          layout: $layout.fill,
          events: {
            didSelect: function(sender, indexPath, data) {
              var device = sender.object(indexPath)
              deviceRecord.data = device
              deviceRecord.render()
            },
            pulled: function(sender) {
              refetch()
            }
          }
        },
        {
          type: "button",
          props: {
            title: "配置"
          },
          layout: function(make, view) {
            make.right.equalTo(-15)
            make.bottom.equalTo(-15)
            make.size.equalTo($size(60, 40))
          },
          events: {
            tapped: function(sender) {
              config.renderView()
            }
          }
        }
      ]
    },
    {
      type: "label",
      props: {
        id: "empty_info",
        hidden: true,
        text: "当前没有设备在线",
        lines: 0,
        align: $align.center
      },
      layout: function(make, view) {
        make.left.right.top.bottom.inset(20)
      }
    }
  ]
})

function refetch() {
  system_status.fetch()
  device_status.fetch()
}

function wol(mac) {
  $console.info("DEBUG WOL " + mac)
  $http.get({
    url: config.data.host + "/wol_action.asp?dstmac=" + mac,
    header: {
      Authorization: config.data.Authorization
    },
    handler: function(resp) {
      $console.info(resp.data)
      if (resp.data.wol_mac == mac) {
        $ui.toast("已发送唤醒请求")
      } else {
        $ui.error("唤醒请求发送失败")
      }
    }
  })
}

function remoteConsole(cmd, callback) {
  $http.post({
    url: config.data.host + "/apply.cgi",
    header: {
      Authorization: config.data.Authorization,
      "Content-Type": 'application/x-www-form-urlencoded'
    },
    body: {
      action_mode: " SystemCmd ",
      SystemCmd: cmd
    },
    handler: function(resp) {
      $console.info(resp.data)
      if (isLogined(resp.data)) {
        $ui.error("已在其他设备登录,请退出后再试")
        isConnected = false
        return
      }
      $http.get({
        url: config.data.host + "/console_response.asp",
        header: {
          Authorization: config.data.Authorization
        },
        handler: function(resp) {
          $console.info(resp.data)
          if (isLogined(resp.data)) {
            $ui.error("已在其他设备登录,请退出后再试")
            isConnected = false
            return
          }
          callback(resp.data)
        }
      })

    }
  })
}

var deviceRecord = {
  data: {},
  fetch: function() {
    var _this = this
    var mac = this.data.mac.text.replace(/:/g, "")
    
    var date = formatDateTime(this.data.date).replace(/-/g,'').slice(0,8)
    $console.info("DEBUG DATE " + date)
    remoteConsole("cat /tmp/deviced/" + date + "/" + mac, function(data) {
      _this.renderData(data)
    })
  },
  render: function() {
    $ui.push(this.view)
    if(!this.data.date){
      this.data.date = new Date()
    }
    $("record_date").text = formatDateTime(this.data.date).slice(0,10)
    this.fetch()
  },
  renderData: function(respData) {
    if(respData.indexOf("No such file") >= 0) {
      this.renderNothing()
      return
    }
    
    var records = respData.replace(/\r/g, '').split("\n")
    if(!records[records.length-1]){
      records.pop()
    }
    if(records.length == 0) {
      this.renderNothing()
      return
    }
    $("empty_record").hidden = true
 
    $console.info(records)
    var data = []
    for (var record of records) {
      var recordArr = record.split(",")
      var rec_status = (recordArr[0] == 0 ? "上线" : "下线" )
      var rec_time = new Date(parseInt(recordArr[1]) * 1000)
      rec_time = formatDateTime(rec_time).replace(/[-|\ ]/g,'').slice(8,13)
      data.push({
        record_status: {
          text: rec_status + ": " + rec_time
        }
      })
    }
    $("record_list").data = data
    $("record_list").endRefreshing()
  },
  renderNothing: function(){
    $ui.toast("nothing")
    $("empty_record").hidden = false
    $("record_list").data = []
    $("record_list").endRefreshing()
  },
  view: {
    props: {
      title: "连接报告"
    },
    views: [
      {
        type: "view",
        props: {
          bgcolor: $color("#eeeeee"),
        },
        layout: function(make, view) {
          make.top.equalTo(0)
          make.width.equalTo(view.super.width)
          make.height.equalTo(120)
        },
        views: [
          {
            type: "label",
            props: {
              id: "record_date",
              font: $font(24)
            },
            layout: function(make, view) {
              make.center.equalTo(view.super)
            }
          },
          {
            type: "button",
            props: {
              title: "前一天"
            },
            layout: function(make, view) {
              make.centerY.equalTo(view.super)
              make.right.equalTo($("record_date").left)
              make.width.equalTo(80)
            },
            events: {
              tapped: function(sender) {
                deviceRecord.data.date = new Date(deviceRecord.data.date.getTime() - 24*60*60*1000)
                $("record_date").text = formatDateTime(deviceRecord.data.date).slice(0,10)
                deviceRecord.fetch()
              }
            }
          },
          {
            type: "button",
            props: {
              title: "后一天"
            },
            layout: function(make, view) {
              make.centerY.equalTo(view.super)
              make.left.equalTo($("record_date").right)
              make.width.equalTo(80)
            },
            events: {
              tapped: function(sender) {
                deviceRecord.data.date = new Date(deviceRecord.data.date.getTime() + 24*60*60*1000)
                $("record_date").text = formatDateTime(deviceRecord.data.date).slice(0,10)
                deviceRecord.fetch()
              }
            }
          }
        ]
      },
      {
        type: "list",
        props: {
          id: "record_list",
          rowHeight: 48.0,
          separatorInset: $insets(0, 5, 0, 0),
          template: [
            {
              type: "label",
              props: {
                id: "record_status",
                font: $font(18),
                lines: 0
              },
              layout: function(make, view) {
                make.center.equalTo(0)
                make.top.bottom.equalTo(0)
              }
            }
          ]
        },
        layout: function(make, view) {
          make.top.equalTo(120)
          make.width.equalTo(view.super.width)
          make.bottom.equalTo(0)
        },
        events: {
          pulled: function(sender) {
            deviceRecord.fetch()
          }
        }
      },{
        type: "label",
        props: {
          id: "empty_record",
          hidden: true,
          text: "找不到连接记录",
          lines: 0,
          align: $align.center
        },
        layout: function(make, view) {
          make.left.right.top.bottom.inset(20)
        }
      },
      {
        type: "spinner",
        props: {
          on: true
        },
        layout: function(make, view) {
          make.center.equalTo(view.super)
        }
      }
    ]
  }
}

var system_status = {
  sysinfo: {},
  fetch: function() {
    var _this = this
    $http.get({
      url: config.data.host + "/system_status_data.asp",
      header: {
        Authorization: config.data.Authorization
      },
      handler: function(resp) {
        $console.info(resp.data)
        if (isLogined(resp.data)) {
          $ui.error("已在其他设备登录,请退出后再试")
          isConnected = false
          return
        }
        if (resp.data.indexOf("si_new") < 0) {
          $ui.error("获取系统状态失败")
          isConnected = false
          return
        }
        eval(resp.data)
        isConnected = true
        _this.render(si_new)
      }
    })
  },
  render: function(si_new) {
    if (!this.sysinfo.cpu) {
      this.sysinfo = si_new
    }
    var sysinfo = this.sysinfo
    var online_devices = 0
    var offline_devoces = 0
    var uptime = si_new.uptime
    var lavg = si_new.lavg

    var cpu_now = {};
    var cpu_total = (si_new.cpu.total - sysinfo.cpu.total);
    if (!cpu_total)
      cpu_total = 1;
    cpu_now.busy = parseInt((si_new.cpu.busy - sysinfo.cpu.busy) * 100 / cpu_total);
    // cpu_now.user = parseInt((si_new.cpu.user - sysinfo.cpu.user) * 100 / cpu_total);
    // cpu_now.nice = parseInt((si_new.cpu.nice - sysinfo.cpu.nice) * 100 / cpu_total);
    // cpu_now.system = parseInt((si_new.cpu.system - sysinfo.cpu.system) * 100 / cpu_total);
    // cpu_now.idle = parseInt((si_new.cpu.idle - sysinfo.cpu.idle) * 100 / cpu_total);
    // cpu_now.iowait = parseInt((si_new.cpu.iowait - sysinfo.cpu.iowait) * 100 / cpu_total);
    // cpu_now.irq = parseInt((si_new.cpu.irq - sysinfo.cpu.irq) * 100 / cpu_total);
    // cpu_now.sirq = parseInt((si_new.cpu.sirq - sysinfo.cpu.sirq) * 100 / cpu_total);

    this.sysinfo = si_new
    var ram = si_new.ram
    var ram_total = bytesToSize(ram.total * 1024, 2)
    var ram_free = bytesToSize(ram.free * 1024, 2)

    var status_text = "平均负载: " + lavg + "\n\n" +
      "CPU负载: " + cpu_now.busy + "%\n\n" +
      "内存空闲: " + ram_free + "/" + ram_total + "\n\n" +
      "运行时间: " + uptime.days + "天" + uptime.hours + "时" + uptime.minutes + "分";

    $("system_status").text = status_text
  }
}

var device_status = {
  fetch: function() {
    var _this = this
    $http.get({
      url: config.data.host + "/lan_clients.asp",
      header: {
        Authorization: config.data.Authorization
      },
      handler: function(resp) {
        $console.info(resp.data)
        if (isLogined(resp.data)) {
          $ui.error("已在其他设备登录,请退出后再试")
          isConnected = false
          return
        }
        if (resp.data.indexOf("ipmonitor_last") < 0) {
          $ui.error("获取列表失败")
          isConnected = false
          return
        }
        eval(resp.data)
        isConnected = true
        _this.render(ipmonitor_last)
      }
    })
  },
  render: function(devices) {
    var data = []

    var online = []
    var offline = []

    for (var device of devices) {
      if (device[5] != 1) {
        online.push(device)
      } else {
        offline.push(device)
      }
    }

    online.sort(function(a, b) {
      var aa = a[0].split(".");
      var bb = b[0].split(".");
      var resulta = aa[0] * 0x1000000 + aa[1] * 0x10000 + aa[2] * 0x100 + aa[3] * 1;
      var resultb = bb[0] * 0x1000000 + bb[1] * 0x10000 + bb[2] * 0x100 + bb[3] * 1;
      return resulta - resultb;
    })

    for (var device of online) {
      data.push({
        name: {
          text: "[在线] " + device[2] + " IP: " + device[0]
        },
        mac: {
          text: device[1]
        }
      })
    }

    for (var device of offline) {
      data.push({
        name: {
          text: "[离线] " + device[2]
        },
        mac: {
          text: device[1]
        }
      })
    }

    $("devices").data = data
    $("devices").endRefreshing()
    if (data.length > 0) {
      $("empty_info").hidden = true
    } else {
      $("empty_info").hidden = false
    }
  }
}

var config = {
  file: "config.json",
  data: {},
  readConfig: function() {
    if ($file.exists(this.file)) {
      var data = $file.read(this.file).string
      data = JSON.parse(data)
      $console.info(data)
      this.data = data
      return data
    }
    $console.info("DEBUG 没有找到配置文件")
    return false
  },
  writeConfig: function(config_data) {
    this.data = config_data
    return $file.write({
      data: $data({ string: JSON.stringify(config_data) }),
      path: config.file
    })
  },
  exec: function() {
    if (!this.readConfig()) {
      this.renderView()
      $ui.toast("请先完成配置")
      return false
    }
    return true
  },
  renderView: function() {
    var data = this.readConfig()
    $ui.push(this.configView)
    if (data) {
      $("txt_host").text = this.data.host
      $("txt_user").text = this.data.user
      $("txt_password").text = this.data.password
    } else {
      $("txt_host").text = "http://"
    }
  },
  configView: {
    props: {
      title: "配置"
    },
    views: [{
      type: "list",
      props: {
        rowHeight: 64.0,
        data: [{
          title: "配置",
          rows: [{
              type: "view",
              views: [{
                  type: "label",
                  props: {
                    text: "后台地址",
                    font: $font(14)
                  },
                  layout: function(make) {
                    make.top.inset(5)
                    make.left.equalTo(15)
                    make.height.equalTo(15)
                  }
                },
                {
                  type: "input",
                  props: {
                    id: "txt_host",
                    type: $kbType.url
                  },
                  events: {
                    returned: function(sender) {
                      sender.blur()
                    },
                  },
                  layout: function(make) {
                    make.top.inset(25)
                    make.left.right.inset(15)
                    make.bottom.inset(5)
                  }
                }
              ],
              layout: $layout.fill
            },
            {
              type: "view",
              views: [{
                  type: "label",
                  props: {
                    text: "用户名",
                    font: $font(14)
                  },
                  layout: function(make) {
                    make.top.inset(5)
                    make.left.equalTo(15)
                    make.height.equalTo(15)
                  }
                },
                {
                  type: "input",
                  props: {
                    id: "txt_user"
                  },
                  events: {
                    returned: function(sender) {
                      sender.blur()
                    },
                  },
                  layout: function(make) {
                    make.top.inset(25)
                    make.left.right.inset(15)
                    make.bottom.inset(5)
                  }
                }
              ],
              layout: $layout.fill
            },
            {
              type: "view",
              views: [{
                  type: "label",
                  props: {
                    text: "密码",
                    font: $font(14)
                  },
                  layout: function(make) {
                    make.top.inset(5)
                    make.left.equalTo(15)
                    make.height.equalTo(15)
                  }
                },
                {
                  type: "input",
                  props: {
                    id: "txt_password",
                    secure: true
                  },
                  events: {
                    returned: function(sender) {
                      sender.blur()
                    },
                  },
                  layout: function(make) {
                    make.top.inset(25)
                    make.left.right.inset(15)
                    make.bottom.inset(5)
                  }
                }
              ],
              layout: $layout.fill
            },
            {
              type: "button",
              props: {
                title: "保存"
              },
              layout: function(make, view) {
                make.center.equalTo(view.super)
                make.width.equalTo(65)
              },
              events: {
                tapped: function(sender) {
                  var data = {
                    host: $("txt_host").text,
                    user: $("txt_user").text,
                    password: $("txt_password").text
                  }
                  data.Authorization = "Basic " + $text.base64Encode(data.user + ":" + data.password)
                  var success = config.writeConfig(data)
                  if (success) {
                    $ui.toast("已保存")
                    $ui.pop()
                    refetch()
                  } else {
                    $ui.error("失败")
                  }
                }
              }
            }
          ]
        }]
      },
      layout: $layout.fill
    }]
  }
}

var refetchTimer = null
var isConnected = false

function main() {
  if (!config.exec()) {
    return
  }
  refetch()
  refetchTimer = $timer.schedule({
    interval: 3,
    handler: function() {
      if (isConnected) {
        refetch()
      }
    }
  })
}
main()

// 判断是否有其他设备登录后台
function isLogined(resp_data) {
  if (resp_data.indexOf("logined_ip_str") >= 0) {
    return true
  }
  return false
}

function bytesToSize(bytes, precision) {
  var absval = Math.abs(bytes);
  var kilobyte = 1024;
  var megabyte = kilobyte * 1024;
  var gigabyte = megabyte * 1024;
  var terabyte = gigabyte * 1024;
  if (absval < kilobyte)
    return bytes + ' B';
  else if (absval < megabyte)
    return (bytes / kilobyte).toFixed(precision) + ' KB';
  else if (absval < gigabyte)
    return (bytes / megabyte).toFixed(precision) + ' MB';
  else if (absval < terabyte)
    return (bytes / gigabyte).toFixed(precision) + ' GB';
  else
    return (bytes / terabyte).toFixed(precision) + ' TB';
}

function formatDateTime(date){
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  month = (month > 9 ? "" : "0") + month
  var day = date.getDate()
  day = (day > 9 ? "" : "0") + day
  var hours = date.getHours()
  hours = (hours > 9 ? "" : "0") + hours
  var minutes = date.getMinutes();
  minutes = (minutes > 9 ? "" : "0") + minutes
  var seconds = date.getSeconds()
  seconds = (seconds > 9 ? "" : "0") + seconds
  return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds
}