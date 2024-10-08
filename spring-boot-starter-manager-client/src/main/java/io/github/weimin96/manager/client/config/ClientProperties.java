

package io.github.weimin96.manager.client.config;

import lombok.Data;
import org.springframework.boot.cloud.CloudPlatform;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.DeprecatedConfigurationProperty;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.boot.convert.DurationUnit;
import org.springframework.core.env.Environment;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

/**
 * @author pwm
 */
@Data
@ConfigurationProperties(prefix = "spring.boot.manager.client")
public class ClientProperties {

	/**
	 * server地址
	 */
	private String[] url = new String[] {};

	/**
	 * server 应用名称 使用nacos作为注册中心时生效
	 */
	private String serverApplicationName;

	/**
	 * server 上下文 使用nacos作为注册中心时生效 默认：serverManager
	 */
	private String serverContextPath = "serverManager";

	/**
	 * server 实例api地址
	 */
	private String apiPath = "api/instances";

	/**
	 * 重复注册的时间间隔
	 */
	@DurationUnit(ChronoUnit.MILLIS)
	private Duration period = Duration.ofMillis(10_000L);

	/**
	 * 注册的连接超时。
	 */
	@DurationUnit(ChronoUnit.MILLIS)
	private Duration connectTimeout = Duration.ofMillis(5_000L);

	/**
	 * 注册的读超时(以毫秒为单位)。
	 */
	@DurationUnit(ChronoUnit.MILLIS)
	private Duration readTimeout = Duration.ofMillis(5_000L);

	/**
	 * 在管理服务器上进行基本认证的用户名
	 */
	private String username;

	/**
	 * 在管理服务器上进行基本身份验证的密码
	 */
	private String password;

	/**
	 * Enable automatic deregistration on shutdown If not set it defaults to true if a
	 * active {@link CloudPlatform} is present;
	 */
	private Boolean autoDeregistration = null;

	/**
	 * 当应用程序准备好时启用自动注册。
	 */
	private boolean autoRegistration = true;

	/**
	 * 对一个或所有管理服务器启用注册
	 */
	private boolean registerOnce = true;

	/**
	 * 启用 Client。
	 */
	private boolean enabled = true;

	public String[] getServerUrl() {
		String[] serverUrls = this.url.clone();
		for (int i = 0; i < serverUrls.length; i++) {
			serverUrls[i] += "/" + this.apiPath;
		}
		return serverUrls;
	}

	public boolean isAutoDeregistration(Environment environment) {
		return (this.autoDeregistration != null) ? this.autoDeregistration
				: (CloudPlatform.getActive(environment) != null);
	}

}
