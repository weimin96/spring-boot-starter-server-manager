
package io.github.weimin96.manager.client.registration.metadata;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import static java.util.Collections.singletonMap;

/**
 * @author pwm
 */
public class StartupDateMetadataContributor implements MetadataContributor {

	private final OffsetDateTime timestamp = OffsetDateTime.now();

	@Override
	public Map<String, String> getMetadata() {
		return singletonMap("startup", this.timestamp.format(DateTimeFormatter.ISO_DATE_TIME));
	}

}
